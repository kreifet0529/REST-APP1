import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT: Replace <REPOSITORY_NAME> with your GitHub repository name
  // For example, if your repo URL is https://github.com/user/my-app,
  // then the base should be '/my-app/'
  base: "/<REPOSITORY_NAME>/", 
})