<script setup lang="ts">
import DefaultLayout from '@/layouts/default.vue'
import PageHeading from '@/components/common/PageHeading.vue'
import ProfileSettings from '@/components/settings/ProfileSettings.vue'
import IntegrationTokensSettings from '@/components/settings/IntegrationTokensSettings.vue'
import { useSettingsPage } from '@/composables/useSettingsPage'

const { auth, heading, profileName, saved, saveProfile } = useSettingsPage()
</script>

<template>
  <DefaultLayout>
    <div class="product-page">
      <PageHeading eyebrow="Workspace" :title="heading.title" :description="heading.description" />
      <ProfileSettings v-model="profileName" :email="auth.user?.email ?? ''" :saved="saved" @save="saveProfile" />
      <IntegrationTokensSettings />
    </div>
  </DefaultLayout>
</template>
