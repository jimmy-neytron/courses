<script setup lang="ts">
import { ref } from 'vue'
import {
  Copy,
  KeyRound,
  Plus,
  RotateCw,
  ShieldCheck,
  Trash2,
} from 'lucide-vue-next'
import FormField from '@/components/common/FormField.vue'
import UiAlert from '@/components/ui/UiAlert.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiModal from '@/components/ui/UiModal.vue'
import { useIntegrationTokens } from '@/composables/useIntegrationTokens'

const {
  activeTokens,
  generatedToken,
  loading,
  creating,
  revokingId,
  error,
  load,
  create,
  revoke,
  dismissGeneratedToken,
} = useIntegrationTokens()

const tokenName = ref('Календарь')
const revokeTokenId = ref('')
const copied = ref(false)

function formattedDate(value?: string): string {
  if (!value) return 'Ещё не использовался'
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

async function createToken(): Promise<void> {
  const name = tokenName.value.trim()
  if (!name) return
  if (await create(name)) tokenName.value = ''
}

async function copyToken(): Promise<void> {
  if (!generatedToken.value) return
  await navigator.clipboard.writeText(generatedToken.value)
  copied.value = true
  window.setTimeout(() => {
    copied.value = false
  }, 1800)
}

async function confirmRevoke(): Promise<void> {
  if (!revokeTokenId.value) return
  if (await revoke(revokeTokenId.value)) {
    revokeTokenId.value = ''
  }
}
</script>

<template>
  <section class="product-settings-page integration-token-settings">
    <article>
      <span class="eyebrow">Integrations API</span>
      <h2>Персональные токены</h2>
      <p>
        Подключайте Courses к календарю и другим доверенным приложениям.
        Токен даёт только чтение опубликованных курсов.
      </p>
      <div class="integration-token-security">
        <ShieldCheck />
        <span>Открытый токен показывается один раз и не хранится в браузере.</span>
      </div>
    </article>

    <div class="integration-token-panel">
      <UiAlert v-if="error" severity="error">{{ error }}</UiAlert>

      <div v-if="generatedToken" class="generated-token">
        <UiAlert severity="success">
          Токен создан. Скопируйте его сейчас — повторно показать его невозможно.
        </UiAlert>
        <div class="generated-token-value">
          <UiInput :model-value="generatedToken" readonly fluid />
          <UiButton severity="secondary" outlined @click="copyToken">
            <Copy />{{ copied ? 'Скопировано' : 'Копировать' }}
          </UiButton>
        </div>
        <UiButton text @click="dismissGeneratedToken">Я сохранил токен</UiButton>
      </div>

      <form class="integration-token-form" @submit.prevent="createToken">
        <FormField label="Название токена">
          <UiInput
            v-model="tokenName"
            maxlength="80"
            placeholder="Например, Рабочий календарь"
            fluid
          />
        </FormField>
        <UiButton type="submit" :loading="creating" :disabled="!tokenName.trim()">
          <Plus />Создать токен
        </UiButton>
      </form>

      <div class="integration-token-list-head">
        <div>
          <strong>Активные токены</strong>
          <small>{{ activeTokens.length }}</small>
        </div>
        <UiButton
          severity="secondary"
          text
          rounded
          :loading="loading"
          aria-label="Обновить список токенов"
          @click="load"
        ><RotateCw /></UiButton>
      </div>

      <div v-if="activeTokens.length" class="integration-token-list">
        <div
          v-for="token in activeTokens"
          :key="token.id"
          class="integration-token-row"
        >
          <span class="integration-token-icon"><KeyRound /></span>
          <div>
            <strong>{{ token.name }}</strong>
            <code>{{ token.prefix }}…</code>
            <small>Последнее использование: {{ formattedDate(token.lastUsedAt) }}</small>
          </div>
          <UiButton
            severity="danger"
            text
            rounded
            :loading="revokingId === token.id"
            :disabled="Boolean(revokingId)"
            :aria-label="`Отозвать токен ${token.name}`"
            @click="revokeTokenId = token.id"
          ><Trash2 /></UiButton>
        </div>
      </div>
      <div v-else-if="!loading" class="integration-token-empty">
        <KeyRound />
        <span>Активных токенов пока нет</span>
      </div>
    </div>

    <UiModal
      v-if="revokeTokenId"
      title="Отозвать токен"
      @close="revokingId || (revokeTokenId = '')"
    >
      <p>
        Подключённый календарь сразу потеряет доступ к Courses.
        Созданные ранее события календаря не изменятся.
      </p>
      <div class="form-actions">
        <UiButton
          severity="secondary"
          outlined
          :disabled="Boolean(revokingId)"
          @click="revokeTokenId = ''"
        >Отмена</UiButton>
        <UiButton
          severity="danger"
          :loading="Boolean(revokingId)"
          @click="confirmRevoke"
        ><Trash2 />Отозвать</UiButton>
      </div>
    </UiModal>
  </section>
</template>

<style scoped>
.integration-token-settings {
  margin-top: 24px;
}

.integration-token-security {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-top: 22px;
  color: #8fd6bd;
  font-size: 13px;
  line-height: 1.55;
}

.integration-token-security svg,
.integration-token-icon svg {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
}

.integration-token-panel,
.generated-token,
.integration-token-form,
.integration-token-list {
  display: grid;
  gap: 16px;
}

.generated-token {
  padding: 16px;
  border: 1px solid rgba(58, 195, 166, .26);
  border-radius: 14px;
  background: rgba(58, 195, 166, .06);
}

.generated-token-value {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
}

.generated-token-value :deep(input) {
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
}

.integration-token-form {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
}

.integration-token-list-head,
.integration-token-list-head > div,
.integration-token-row {
  display: flex;
  align-items: center;
}

.integration-token-list-head {
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px solid var(--border);
}

.integration-token-list-head > div {
  gap: 9px;
}

.integration-token-list-head small {
  display: grid;
  place-items: center;
  min-width: 22px;
  min-height: 22px;
  border-radius: 999px;
  background: rgba(255, 255, 255, .08);
}

.integration-token-row {
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: rgba(255, 255, 255, .025);
}

.integration-token-icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  color: #8fd6bd;
  background: rgba(58, 195, 166, .1);
}

.integration-token-row > div {
  display: grid;
  min-width: 0;
  margin-right: auto;
  gap: 3px;
}

.integration-token-row code {
  color: #8fd6bd;
  font-size: 12px;
}

.integration-token-row small,
.integration-token-empty {
  color: var(--muted);
  font-size: 12px;
}

.integration-token-empty {
  display: flex;
  gap: 9px;
  align-items: center;
  justify-content: center;
  padding: 24px;
  border: 1px dashed var(--border);
  border-radius: 14px;
}

@media (max-width: 680px) {
  .integration-token-form,
  .generated-token-value {
    grid-template-columns: 1fr;
  }
}
</style>
