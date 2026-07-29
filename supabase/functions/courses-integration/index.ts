import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  buildCourseListItem,
  buildCourseManifest,
  type IntegrationCourseRow,
  type IntegrationReleaseRow,
} from './contract.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

interface ApiErrorBody {
  error: {
    code: string
    message: string
  }
}

interface ManagementBody {
  action?: 'list-tokens' | 'create-token' | 'revoke-token'
  payload?: Record<string, unknown>
}

interface VerifiedToken {
  token_id: string
  user_id: string
  scopes: string[]
}

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const publicAppUrl = (
  Deno.env.get('COURSES_PUBLIC_APP_URL')
  ?? ''
).replace(/\/+$/, '')

const service = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
)

function json(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        ...headers,
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    },
  )
}

function apiError(
  status: number,
  code: string,
  message: string,
): Response {
  const body: ApiErrorBody = {
    error: {
      code,
      message,
    },
  }
  return json(body, status)
}

function bearerToken(request: Request): string {
  const header = request.headers.get('authorization') ?? ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() ?? ''
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function randomSegment(byteLength: number): string {
  return bytesToBase64Url(
    crypto.getRandomValues(
      new Uint8Array(byteLength),
    ),
  )
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  )

  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function authenticatedUserId(
  request: Request,
): Promise<string | undefined> {
  const jwt = bearerToken(request)
  if (!jwt) return

  const { data, error } = await service.auth.getUser(jwt)
  if (error) return
  return data.user?.id
}

async function handleManagement(
  request: Request,
): Promise<Response> {
  const userId = await authenticatedUserId(request)
  if (!userId) {
    return apiError(
      401,
      'AUTHENTICATION_REQUIRED',
      'Войдите в Courses, чтобы управлять токенами',
    )
  }

  let body: ManagementBody
  try {
    body = await request.json() as ManagementBody
  } catch {
    return apiError(
      400,
      'INVALID_REQUEST',
      'Некорректное тело запроса',
    )
  }

  if (body.action === 'list-tokens') {
    const { data, error } = await service
      .from('integration_api_tokens')
      .select(
        'id,name,token_prefix,scopes,last_used_at,expires_at,revoked_at,created_at',
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return json({ tokens: data ?? [] })
  }

  if (body.action === 'create-token') {
    const name = String(body.payload?.name ?? '').trim()
    if (!name || name.length > 80) {
      return apiError(
        422,
        'INVALID_TOKEN_NAME',
        'Укажите название токена до 80 символов',
      )
    }

    const prefix = `crs_${randomSegment(9)}`
    const rawToken = `${prefix}_${randomSegment(32)}`
    const tokenHash = await sha256(rawToken)

    const { data, error } = await service
      .from('integration_api_tokens')
      .insert({
        user_id: userId,
        name,
        token_prefix: prefix,
        token_hash: tokenHash,
        scopes: ['courses:read'],
      })
      .select(
        'id,name,token_prefix,scopes,last_used_at,expires_at,revoked_at,created_at',
      )
      .single()

    if (error) throw error

    return json(
      {
        token: rawToken,
        metadata: data,
      },
      201,
    )
  }

  if (body.action === 'revoke-token') {
    const tokenId = String(body.payload?.tokenId ?? '')
    if (!tokenId) {
      return apiError(
        422,
        'TOKEN_ID_REQUIRED',
        'Токен не выбран',
      )
    }

    const { data, error } = await service
      .from('integration_api_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', tokenId)
      .eq('user_id', userId)
      .is('revoked_at', null)
      .select('id')
      .maybeSingle()

    if (error) throw error
    if (!data) {
      return apiError(
        404,
        'TOKEN_NOT_FOUND',
        'Активный токен не найден',
      )
    }

    return json({ revoked: true })
  }

  return apiError(
    400,
    'UNKNOWN_ACTION',
    'Неизвестное действие',
  )
}

async function verifyApiToken(
  request: Request,
): Promise<VerifiedToken | Response> {
  const token = bearerToken(request)
  if (!token) {
    return apiError(
      401,
      'TOKEN_REQUIRED',
      'Персональный токен не передан',
    )
  }

  const tokenHash = await sha256(token)
  const { data, error } = await service.rpc(
    'verify_integration_api_token',
    {
      p_token_hash: tokenHash,
      p_required_scope: 'courses:read',
    },
  )

  if (error) {
    if (error.message.includes('rate_limit')) {
      return apiError(
        429,
        'RATE_LIMIT_EXCEEDED',
        'Слишком много запросов. Повторите позже',
      )
    }
    if (error.message.includes('scope_required')) {
      return apiError(
        403,
        'SCOPE_REQUIRED',
        'Токен не имеет права courses:read',
      )
    }
    return apiError(
      401,
      'TOKEN_INVALID',
      'Токен неверный, просрочен или отозван',
    )
  }

  const verified = (data as VerifiedToken[] | null)?.[0]
  if (!verified) {
    return apiError(
      401,
      'TOKEN_INVALID',
      'Токен неверный, просрочен или отозван',
    )
  }

  return verified
}

async function listCourses(
  verified: VerifiedToken,
): Promise<Response> {
  const { data: profile, error: profileError } = await service
    .from('profiles')
    .select('id,display_name')
    .eq('id', verified.user_id)
    .single()

  if (profileError) throw profileError

  const { data: courseData, error: courseError } = await service
    .from('courses')
    .select(`
      id,
      title,
      description,
      cover_path,
      accent_color,
      duration_weeks,
      lessons_per_week,
      default_lesson_duration,
      updated_at,
      current_release_id
    `)
    .eq('status', 'published')
    .not('current_release_id', 'is', null)
    .or(
      `owner_id.eq.${verified.user_id},visibility.in.(public,unlisted)`,
    )
    .order('updated_at', { ascending: false })

  if (courseError) throw courseError

  const courses = (courseData ?? []) as IntegrationCourseRow[]
  const releaseIds = courses.map(
    (course) => course.current_release_id,
  )

  let releases: IntegrationReleaseRow[] = []
  if (releaseIds.length) {
    const { data, error } = await service
      .from('course_releases')
      .select(
        'id,course_id,version,lesson_count,published_at,snapshot',
      )
      .in('id', releaseIds)

    if (error) throw error
    releases = (data ?? []) as IntegrationReleaseRow[]
  }

  const releasesById = new Map(
    releases.map((release) => [release.id, release]),
  )

  return json({
    user: {
      id: profile.id,
      displayName: profile.display_name ?? '',
    },
    courses: courses.flatMap((course) => {
      const release = releasesById.get(
        course.current_release_id,
      )
      return release
        ? [buildCourseListItem(course, release)]
        : []
    }),
  })
}

async function getManifest(
  verified: VerifiedToken,
  courseId: string,
  releaseId: string,
): Promise<Response> {
  if (!publicAppUrl) {
    return apiError(
      500,
      'CONFIGURATION_ERROR',
      'Публичный адрес Courses не настроен',
    )
  }

  const { data: courseData, error: courseError } = await service
    .from('courses')
    .select(`
      id,
      owner_id,
      title,
      cover_path,
      accent_color,
      default_lesson_duration,
      current_release_id,
      status,
      visibility
    `)
    .eq('id', courseId)
    .maybeSingle()

  if (courseError) throw courseError
  if (!courseData) {
    return apiError(
      404,
      'COURSE_NOT_FOUND',
      'Курс не найден',
    )
  }

  const accessible = (
    courseData.status === 'published'
    && (
      courseData.owner_id === verified.user_id
      || courseData.visibility === 'public'
      || courseData.visibility === 'unlisted'
    )
  )

  if (!accessible) {
    return apiError(
      403,
      'COURSE_ACCESS_DENIED',
      'Нет доступа к курсу',
    )
  }

  const { data: releaseData, error: releaseError } = await service
    .from('course_releases')
    .select(
      'id,course_id,version,lesson_count,published_at,snapshot',
    )
    .eq('id', releaseId)
    .eq('course_id', courseId)
    .maybeSingle()

  if (releaseError) throw releaseError
  if (!releaseData) {
    return apiError(
      409,
      'RELEASE_UNAVAILABLE',
      'Опубликованная версия курса больше недоступна',
    )
  }

  const manifest = buildCourseManifest(
    courseData as IntegrationCourseRow,
    releaseData as IntegrationReleaseRow,
    publicAppUrl,
  )

  if (!manifest.lessons.length) {
    return apiError(
      409,
      'EMPTY_MANIFEST',
      'В опубликованной версии курса нет уроков',
    )
  }

  return json(manifest)
}

async function handleApi(request: Request): Promise<Response> {
  const verified = await verifyApiToken(request)
  if (verified instanceof Response) return verified

  const url = new URL(request.url)
  const pathname = url.pathname.replace(/\/+$/, '')

  if (pathname.endsWith('/integration/v1/courses')) {
    return listCourses(verified)
  }

  const manifestMatch = pathname.match(
    /\/integration\/v1\/courses\/([^/]+)\/manifest$/,
  )
  if (manifestMatch) {
    const releaseId = url.searchParams.get('releaseId')?.trim()
    if (!releaseId) {
      return apiError(
        400,
        'RELEASE_ID_REQUIRED',
        'Не указан releaseId',
      )
    }

    return getManifest(
      verified,
      decodeURIComponent(manifestMatch[1] ?? ''),
      releaseId,
    )
  }

  return apiError(
    404,
    'ENDPOINT_NOT_FOUND',
    'Метод API не найден',
  )
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  try {
    if (request.method === 'POST') {
      return await handleManagement(request)
    }
    if (request.method === 'GET') {
      return await handleApi(request)
    }

    return apiError(
      405,
      'METHOD_NOT_ALLOWED',
      'HTTP-метод не поддерживается',
    )
  } catch (error) {
    console.error(JSON.stringify({
      event: 'courses_integration_request_failed',
      method: request.method,
      path: new URL(request.url).pathname,
      errorType: error instanceof Error
        ? error.name
        : 'UnknownError',
    }))
    return apiError(
      500,
      'INTERNAL_ERROR',
      'Courses временно недоступен',
    )
  }
})
