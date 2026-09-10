import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { fetchPublic } from './api'

global.fetch = vi.fn() as Mock

describe('fetchPublic', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should construct a same-origin API URL by default', async () => {
        const mockResponse = { ok: true, json: () => Promise.resolve({ data: 'test' }) } as Response;
        (global.fetch as Mock).mockResolvedValue(mockResponse)

        await fetchPublic('/api/test/')
        
        expect(global.fetch).toHaveBeenCalledWith(
            '/api/test/',
            expect.anything()
        )
    })

    it('should handle FormData by deleting Content-Type header', async () => {
        const formData = new FormData()
        formData.append('file', new Blob(['test'], { type: 'text/plain' }))

        const mockResponse = { ok: true, json: () => Promise.resolve({ success: true }) } as Response;
        (global.fetch as Mock).mockResolvedValue(mockResponse)

        await fetchPublic('/api/upload/', {
            method: 'POST',
            body: formData
        })

        const [, options] = (global.fetch as Mock).mock.calls[0]
        expect(options.headers).not.toHaveProperty('Content-Type')
    })
})
