import { randomUUID } from 'node:crypto'
import { url } from 'node:inspector'
import { Readable } from 'node:stream'
import { db } from '@/infra/db'
import { schema } from '@/infra/db/schemas'
import { isLeft, isRight, unwrapEither } from '@/shared/either'
import { makeUpload } from '@/test/factories/make-upload'
import dayjs from 'dayjs'
import { eq } from 'drizzle-orm'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { InvalidFileFormat } from './errors/invalid-file-format'
import { getUploads } from './get-uploads'
import { uploadImage } from './upload-image'

describe('get uploads', () => {
  it('should be able to get the uploads', async () => {
    const namePattern = randomUUID()

    const upload1 = await makeUpload({ name: `${namePattern}.jpg` })
    const upload2 = await makeUpload({ name: `${namePattern}.jpg` })
    const upload3 = await makeUpload({ name: `${namePattern}.jpg` })
    const upload4 = await makeUpload({ name: `${namePattern}.jpg` })
    const upload5 = await makeUpload({ name: `${namePattern}.jpg` })

    const sut = await getUploads({
      searchQuery: namePattern,
    })

    expect(isRight(sut)).toBe(true)
    expect(unwrapEither(sut).total).toEqual(5)
    expect(unwrapEither(sut).uploads).toEqual([
      expect.objectContaining({ id: upload5.id }),
      expect.objectContaining({ id: upload4.id }),
      expect.objectContaining({ id: upload3.id }),
      expect.objectContaining({ id: upload2.id }),
      expect.objectContaining({ id: upload1.id }),
    ])
  })

  it('should be able to get paginated uploads', async () => {
    const namePattern = randomUUID()

    const upload1 = await makeUpload({ name: `${namePattern}.jpg` })
    const upload2 = await makeUpload({ name: `${namePattern}.jpg` })
    const upload3 = await makeUpload({ name: `${namePattern}.jpg` })
    const upload4 = await makeUpload({ name: `${namePattern}.jpg` })
    const upload5 = await makeUpload({ name: `${namePattern}.jpg` })

    let sut = await getUploads({
      searchQuery: namePattern,
      page: 1,
      pageSize: 3,
    })

    expect(isRight(sut)).toBe(true)
    expect(unwrapEither(sut).total).toEqual(5)
    expect(unwrapEither(sut).uploads).toEqual([
      expect.objectContaining({ id: upload5.id }),
      expect.objectContaining({ id: upload4.id }),
      expect.objectContaining({ id: upload3.id }),
    ])

    sut = await getUploads({
      searchQuery: namePattern,
      page: 2,
      pageSize: 3,
    })

    expect(isRight(sut)).toBe(true)
    expect(unwrapEither(sut).total).toEqual(5)
    expect(unwrapEither(sut).uploads).toEqual([
      expect.objectContaining({ id: upload2.id }),
      expect.objectContaining({ id: upload1.id }),
    ])
  })

  it('should be able to get sorted uploads', async () => {
    const namePattern = randomUUID()

    const upload1 = await makeUpload({
      name: `${namePattern}.jpg`,
      createdAt: new Date(),
    })
    const upload2 = await makeUpload({
      name: `${namePattern}.jpg`,
      createdAt: dayjs().subtract(1, 'days').toDate(),
    })
    const upload3 = await makeUpload({
      name: `${namePattern}.jpg`,
      createdAt: dayjs().subtract(2, 'days').toDate(),
    })
    const upload4 = await makeUpload({
      name: `${namePattern}.jpg`,
      createdAt: dayjs().subtract(3, 'days').toDate(),
    })
    const upload5 = await makeUpload({
      name: `${namePattern}.jpg`,
      createdAt: dayjs().subtract(4, 'days').toDate(),
    })

    let sut = await getUploads({
      searchQuery: namePattern,
      sortBy: 'createdAt',
      sortDirection: 'desc',
    })

    expect(isRight(sut)).toBe(true)
    expect(unwrapEither(sut).total).toEqual(5)
    expect(unwrapEither(sut).uploads).toEqual([
      expect.objectContaining({ id: upload1.id }),
      expect.objectContaining({ id: upload2.id }),
      expect.objectContaining({ id: upload3.id }),
      expect.objectContaining({ id: upload4.id }),
      expect.objectContaining({ id: upload5.id }),
    ])

    sut = await getUploads({
      searchQuery: namePattern,
      sortBy: 'createdAt',
      sortDirection: 'asc',
    })

    expect(isRight(sut)).toBe(true)
    expect(unwrapEither(sut).total).toEqual(5)
    expect(unwrapEither(sut).uploads).toEqual([
      expect.objectContaining({ id: upload5.id }),
      expect.objectContaining({ id: upload4.id }),
      expect.objectContaining({ id: upload3.id }),
      expect.objectContaining({ id: upload2.id }),
      expect.objectContaining({ id: upload1.id }),
    ])
  })
})
