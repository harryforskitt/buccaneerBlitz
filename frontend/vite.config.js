import ViteRestart from 'vite-plugin-restart'

export default {
  plugins: [
    ViteRestart({
      restart: [
        '*',
      ]
    })
  ],
  host:true,
}