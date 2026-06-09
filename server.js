require('dotenv').config()
const express     = require('express')
const helmet      = require('helmet')
const compression = require('compression')
const cors        = require('cors')
const morgan      = require('morgan')
const path        = require('path')

const apiRoutes   = require('./routes/api.js')
const seoRoutes   = require('./routes/seo.js')

const app  = express()
const PORT = process.env.PORT || 3000

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      styleSrc:   ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'],
      fontSrc:    ["'self'", 'https://fonts.gstatic.com'],
      connectSrc: ["'self'"],
      imgSrc:     ["'self'", 'data:', 'https:'],
      mediaSrc:   ["'self'", 'blob:'],
    },
  },
}))

app.use(compression())
app.use(cors({ origin: process.env.SITE_URL || '*' }))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// Serve built React app
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '7d', etag: true }))

// SEO routes
app.use('/', seoRoutes)

// API routes
app.use('/api', apiRoutes)

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.use((err, req, res, next) => {
  console.error('[Error]', err.stack)
  res.status(500).json({ success: false, error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`\n🎙️  VoiceBot AI  →  http://localhost:${PORT}`)
  console.log(`🌍  Env          :  ${process.env.NODE_ENV || 'development'}\n`)
})
