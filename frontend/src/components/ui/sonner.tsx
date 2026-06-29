import { Toaster as Sonner, type ToasterProps } from 'sonner'
import { useTheme } from '@/store/theme'

export function Toaster(props: ToasterProps) {
  const { theme } = useTheme()
  const sonnerTheme: ToasterProps['theme'] = theme === 'auto' ? 'system' : theme
  return (
    <Sonner
      theme={sonnerTheme}
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground ' +
            'group-[.toaster]:border-border group-[.toaster]:shadow-overlay',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  )
}
