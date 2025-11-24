import { ref } from 'vue'

const isLoading = ref(false)
const loadingMessage = ref('')

export const useLoading = () => {
  const showLoading = (message = '') => {
    loadingMessage.value = message
    isLoading.value = true
  }

  const hideLoading = () => {
    isLoading.value = false
    loadingMessage.value = ''
  }

  return {
    isLoading,
    loadingMessage,
    showLoading,
    hideLoading
  }
}
