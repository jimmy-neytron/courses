<script setup lang="ts">
import { ShieldCheck } from 'lucide-vue-next'
import DefaultLayout from '@/layouts/default.vue'
import PageHeading from '@/components/common/PageHeading.vue'
import IntegrationOverview from '@/components/settings/IntegrationOverview.vue'
import ProfileSettings from '@/components/settings/ProfileSettings.vue'
import { useWorkspaceSettings } from '@/composables/useWorkspaceSettings'

const { auth, section, heading, profileName, copied, copyEndpoint, saved, saveProfile } = useWorkspaceSettings()
</script>

<template>
  <DefaultLayout>
    <div v-if="section === 'integrations'" class="workspace-page integration-page">
      <section class="integration-intro is-compact">
        <h1>Интеграции</h1>
        <div class="integration-health"><ShieldCheck /><strong>Подключение активно</strong></div>
      </section>
      <IntegrationOverview :organization="auth.organization?.name" :email="auth.user?.email" :copied="copied" @copy="copyEndpoint()" />

    </div>
    <div v-else class="product-page">
      <PageHeading eyebrow="Workspace" :title="heading.title" :description="heading.description" />
      <ProfileSettings v-model="profileName" :email="auth.user?.email ?? ''" :saved="saved" @save="saveProfile" />
    </div>
  </DefaultLayout>
</template>