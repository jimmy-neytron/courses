-- Fresh installation: extensions and enums.
create extension if not exists pgcrypto;

create type public.course_status as enum ('draft', 'published', 'archived');
create type public.course_visibility as enum ('private', 'unlisted', 'public');
create type public.lesson_status as enum ('draft', 'published', 'archived');
