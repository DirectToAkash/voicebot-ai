const express              = require('express')
const { rateLimit }        = require('express-rate-limit')
const { body, validationResult } = require('express-validator')
const NodeCache             = require('node-cache')
const axios                 = require('axios')

const router = express.Router()
const cache  = new NodeCache({ stdTTL: parseInt(process.env.CACHE_TTL_SECONDS) || 3600 })

const limiter = rateLimit({
  windowMs: 60_000, max: 20,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, error: 'Too many requests.' },
})

const validateTTS = [
  body('text').trim().notEmpty().isLength({ max: 5000 }),
  body('voice').optional().isString().isLength({ max: 100 }),
  body('speed').optional().isFloat({ min: 0.5, max: 2.0 }),
  body('pitch').optional().isFloat({ min: -10, max: 10 }),
  body('style').optional().isIn(['Default','Cheerful','Empathetic','Newscast','Narration','Excited','Calm']),
]

async function synthesize({ text, voice, speed, pitch, style }) {
  const provider = (process.env.TTS_PROVIDER || 'azure').toLowerCase()

  if (provider === 'azure') {
    const region = process.env.AZURE_TTS_REGION || 'eastus'
    const key    = process.env.AZURE_TTS_KEY
    const voiceName = voice || 'en-US-AriaNeural'
    const rate      = `${((speed - 1) * 100).toFixed(0)}%`
    const pitchStr  = `${pitch > 0 ? '+' : ''}${pitch}Hz`
    const styleTag  = style && style !== 'Default' ? `<mstts:express-as style="${style.toLowerCase()}">` : ''
    const styleEnd  = style && style !== 'Default' ? '</mstts:express-as>' : ''
    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US"><voice name="${voiceName}"><prosody rate="${rate}" pitch="${pitchStr}">${styleTag}${text}${styleEnd}</prosody></voice></speak>`
    const res = await axios.post(
      `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
      ssml,
      { headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3' }, responseType: 'arraybuffer', timeout: 15000 }
    )
    return { audio: res.data, contentType: 'audio/mpeg' }
  }

  if (provider === 'elevenlabs') {
    const voiceId = voice || 'EXAVITQu4vr4xnSDxMaL'
    const res = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      { text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: speed || 1.0 } },
      { headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' }, responseType: 'arraybuffer', timeout: 20000 }
    )
    return { audio: res.data, contentType: 'audio/mpeg' }
  }

  if (provider === 'google') {
    const res = await axios.post(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_TTS_KEY}`,
      { input: { text }, voice: { languageCode: 'en-US', name: voice || 'en-US-Neural2-F' }, audioConfig: { audioEncoding: 'MP3', speakingRate: speed || 1.0, pitch: pitch || 0 } },
      { timeout: 15000 }
    )
    return { audio: Buffer.from(res.data.audioContent, 'base64'), contentType: 'audio/mpeg' }
  }

  throw new Error(`Unknown TTS_PROVIDER: ${provider}`)
}

router.post('/tts', limiter, validateTTS, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() })
  const { text, voice, speed, pitch, style } = req.body
  const cacheKey = Buffer.from(JSON.stringify({ text, voice, speed, pitch, style })).toString('base64').slice(0, 80)
  const cached   = cache.get(cacheKey)
  if (cached) {
    res.setHeader('Content-Type', cached.contentType)
    res.setHeader('Content-Length', cached.audio.length)
    return res.send(cached.audio)
  }
  try {
    const { audio, contentType } = await synthesize({ text, voice, speed: parseFloat(speed || 1), pitch: parseFloat(pitch || 0), style })
    cache.set(cacheKey, { audio, contentType })
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Length', audio.length)
    res.setHeader('Content-Disposition', 'inline; filename="voicebot-ai.mp3"')
    res.send(audio)
  } catch (err) {
    console.error('[TTS Error]', err.message)
    res.status(500).json({ success: false, error: 'Voice generation failed.' })
  }
})

router.get('/voices', (req, res) => {
  res.json({ success: true, voices: [
    { id: 'en-US-AriaNeural',   name: 'Aria',   lang: 'English (US)', gender: 'F', tag: 'Warm'          },
    { id: 'en-US-GuyNeural',    name: 'Guy',     lang: 'English (US)', gender: 'M', tag: 'Confident'     },
    { id: 'en-GB-LibbyNeural',  name: 'Libby',   lang: 'English (UK)', gender: 'F', tag: 'Crisp'         },
    { id: 'en-GB-RyanNeural',   name: 'Ryan',    lang: 'English (UK)', gender: 'M', tag: 'Authoritative' },
    { id: 'hi-IN-SwaraNeural',  name: 'Swara',   lang: 'Hindi',        gender: 'F', tag: 'Soft'          },
    { id: 'es-ES-ElviraNeural', name: 'Elvira',  lang: 'Spanish',      gender: 'F', tag: 'Lively'        },
    { id: 'ja-JP-NanamiNeural', name: 'Nanami',  lang: 'Japanese',     gender: 'F', tag: 'Gentle'        },
    { id: 'fr-FR-DeniseNeural', name: 'Denise',  lang: 'French',       gender: 'F', tag: 'Elegant'       },
    { id: 'de-DE-KatjaNeural',  name: 'Katja',   lang: 'German',       gender: 'F', tag: 'Clear'         },
  ]})
})

router.get('/health', (req, res) => {
  res.json({ success: true, status: 'ok', uptime: process.uptime() })
})

module.exports = router
