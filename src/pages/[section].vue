<script setup lang="ts">
import DefaultLayout from '@/layouts/default.vue'
import PageHeading from '@/components/common/PageHeading.vue'
import IntegrationOverview from '@/components/settings/IntegrationOverview.vue'
import ProfileSettings from '@/components/settings/ProfileSettings.vue'
import { useWorkspaceSettings } from '@/composables/useWorkspaceSettings'

const { auth, section, heading, profileName, copied, copyEndpoint, saved, saveProfile } = useWorkspaceSettings()
</script>

<template>
  <DefaultLayout>
    <div class="product-page">
      <PageHeading eyebrow="Workspace" :title="heading.title" :description="heading.description" />
      <IntegrationOverview v-if="section === 'integrations'" :organization="auth.organization?.name" :email="auth.user?.email" :copied="copied" @copy="copyEndpoint()" />
      <ProfileSettings v-else v-model="profileName" :email="auth.user?.email ?? ''" :saved="saved" @save="saveProfile" />
    </div>
  </DefaultLayout>
</template>
