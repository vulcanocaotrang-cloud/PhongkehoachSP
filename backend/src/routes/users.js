const { Router } = require('express')
const { PrismaClient } = require('@prisma/client')
const { body, validationResult } = require('express-validator')

const router = Router()
const prisma = new PrismaClient()

router.get('/', async (_req, res) => {
  const users = await prisma.user.findMany()
  res.json(users)
})

router.get('/:id', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) } })
  if (!user) return res.status(404).json({ error: 'Not found' })
  res.json(user)
})

router.post(
  '/',
  body('email').isEmail(),
  body('name').optional().isString().trim(),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    try {
      const user = await prisma.user.create({ data: req.body })
      res.status(201).json(user)
    } catch (e) {
      if (e.code === 'P2002') return res.status(409).json({ error: 'Email already exists' })
      throw e
    }
  }
)

router.put('/:id', async (req, res) => {
  try {
    const user = await prisma.user.update({ where: { id: Number(req.params.id) }, data: req.body })
    res.json(user)
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Not found' })
    throw e
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: Number(req.params.id) } })
    res.status(204).send()
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Not found' })
    throw e
  }
})

module.exports = router
