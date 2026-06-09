const express = require('express')
const { SitemapStream, streamToPromise } = require('sitemap')
const { Readable } = require('stream')

const router   = express.Router()
const SITE_URL = process.env.SITE_URL || 'https://mybots.in'

router.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`)
})

router.get('/sitemap.xml', async (req, res) => {
  try {
    const links = [
      { url: '/', changefreq: 'daily', priority: 1.0 },
      { url: '/text-to-voice', changefreq: 'monthly', priority: 0.8 },
      { url: '/text-to-speech', changefreq: 'monthly', priority: 0.8 },
    ]
    const stream = new SitemapStream({ hostname: SITE_URL })
    const data   = await streamToPromise(Readable.from(links).pipe(stream))
    res.header('Content-Type', 'application/xml').send(data.toString())
  } catch (err) {
    res.status(500).send('Sitemap error')
  }
})

module.exports = router
