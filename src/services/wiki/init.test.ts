import { afterEach, expect, test } from 'bun:test'
import { mkdtemp, readFile, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { initializeWiki } from './init.js'
import { getWikiPaths } from './paths.js'

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })),
  )
})

async function makeProjectDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'wormgpt-wiki-init-'))
  tempDirs.push(dir)
  return dir
}

test('initializeWiki creates the expected wiki scaffold', async () => {
  const cwd = await makeProjectDir()
  const result = await initializeWiki(cwd)
  const paths = getWikiPaths(cwd)

  expect(result.alreadyExisted).toBe(false)
  expect(result.createdFiles).toEqual([
    join('.wormgpt', 'wiki', 'schema.md'),
    join('.wormgpt', 'wiki', 'index.md'),
    join('.wormgpt', 'wiki', 'log.md'),
    join('.wormgpt', 'wiki', 'pages', 'architecture.md'),
    join('.wormgpt', 'wiki', 'pages', 'conventions.md'),
  ])
  expect(await readFile(paths.schemaFile, 'utf8')).toContain(
    '# WormGPT Wiki Schema',
  )
  expect(await readFile(paths.indexFile, 'utf8')).toContain('Wiki')
  expect(await readFile(paths.logFile, 'utf8')).toContain(
    'Wiki initialized by WormGPT',
  )
  expect(await readFile(join(paths.pagesDir, 'architecture.md'), 'utf8')).toContain(
    '# Architecture',
  )
  expect(await readFile(paths.conventionsFile, 'utf8')).toContain(
    '# Project Conventions',
  )
})

test('initializeWiki is idempotent and preserves existing files', async () => {
  const cwd = await makeProjectDir()

  await initializeWiki(cwd)
  const second = await initializeWiki(cwd)

  expect(second.alreadyExisted).toBe(true)
  expect(second.createdFiles).toEqual([])
})
