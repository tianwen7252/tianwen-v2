import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

// Project root is two levels up from src/lib/
const ROOT = path.resolve(__dirname, '../..')

describe('release-please configuration', () => {
  describe('release-please-config.json', () => {
    it('is valid JSON with correct release-type', () => {
      const content = fs.readFileSync(
        path.join(ROOT, 'release-please-config.json'),
        'utf-8',
      )
      const config = JSON.parse(content)
      expect(config['release-type']).toBe('node')
    })

    it('has root package configured', () => {
      const content = fs.readFileSync(
        path.join(ROOT, 'release-please-config.json'),
        'utf-8',
      )
      const config = JSON.parse(content)
      expect(config.packages['.']).toBeDefined()
    })

    it('has correct package-name', () => {
      const content = fs.readFileSync(
        path.join(ROOT, 'release-please-config.json'),
        'utf-8',
      )
      const config = JSON.parse(content)
      expect(config.packages['.']['package-name']).toBe('tianwen-pos')
    })

    it('has changelog-path configured', () => {
      const content = fs.readFileSync(
        path.join(ROOT, 'release-please-config.json'),
        'utf-8',
      )
      const config = JSON.parse(content)
      expect(config.packages['.']['changelog-path']).toBe('CHANGELOG.md')
    })

    it('enables prerelease mode with alpha type', () => {
      const content = fs.readFileSync(
        path.join(ROOT, 'release-please-config.json'),
        'utf-8',
      )
      const config = JSON.parse(content)
      const pkg = config.packages['.']
      expect(pkg.prerelease).toBe(true)
      expect(pkg['prerelease-type']).toBe('alpha')
    })

    it('bumps minor pre-major for semver safety', () => {
      const content = fs.readFileSync(
        path.join(ROOT, 'release-please-config.json'),
        'utf-8',
      )
      const config = JSON.parse(content)
      const pkg = config.packages['.']
      expect(pkg['bump-minor-pre-major']).toBe(true)
      expect(pkg['bump-patch-for-minor-pre-major']).toBe(true)
    })
  })

  describe('.release-please-manifest.json', () => {
    it('is valid JSON with root entry', () => {
      const content = fs.readFileSync(
        path.join(ROOT, '.release-please-manifest.json'),
        'utf-8',
      )
      const manifest = JSON.parse(content)
      expect(manifest['.']).toBeDefined()
    })

    it('version matches package.json version', () => {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'),
      )
      const manifest = JSON.parse(
        fs.readFileSync(
          path.join(ROOT, '.release-please-manifest.json'),
          'utf-8',
        ),
      )
      expect(manifest['.']).toBe(pkg.version)
    })
  })

  describe('release-please workflow', () => {
    it('workflow file exists', () => {
      const exists = fs.existsSync(
        path.join(ROOT, '.github/workflows/release-please.yml'),
      )
      expect(exists).toBe(true)
    })

    it('workflow references correct config files', () => {
      const content = fs.readFileSync(
        path.join(ROOT, '.github/workflows/release-please.yml'),
        'utf-8',
      )
      expect(content).toContain('release-please-config.json')
      expect(content).toContain('.release-please-manifest.json')
    })
  })
})
