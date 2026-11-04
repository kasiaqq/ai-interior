import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import BeforeAfterSlider from '~/components/result/BeforeAfterSlider.vue'

const mountSlider = () =>
  mount(BeforeAfterSlider, {
    props: { beforeUrl: 'blob:before', afterUrl: 'blob:after', afterLabel: 'After · Japandi', width: 1024, height: 672 },
    global: { stubs: { AppIcon: true } },
  })

describe('BeforeAfterSlider', () => {
  it('starts in the middle as an accessible slider', () => {
    const handle = mountSlider().get('[role="slider"]')
    expect(handle.attributes('aria-valuenow')).toBe('50')
    expect(handle.attributes('aria-valuemin')).toBe('0')
    expect(handle.attributes('aria-valuemax')).toBe('100')
  })

  it('moves by 5 % with the arrow keys', async () => {
    const handle = mountSlider().get('[role="slider"]')
    await handle.trigger('keydown', { key: 'ArrowRight' })
    expect(handle.attributes('aria-valuenow')).toBe('55')
    await handle.trigger('keydown', { key: 'ArrowLeft' })
    await handle.trigger('keydown', { key: 'ArrowLeft' })
    expect(handle.attributes('aria-valuenow')).toBe('45')
  })

  it('jumps to the ends with Home and End', async () => {
    const handle = mountSlider().get('[role="slider"]')
    await handle.trigger('keydown', { key: 'End' })
    expect(handle.attributes('aria-valuenow')).toBe('100')
    await handle.trigger('keydown', { key: 'Home' })
    expect(handle.attributes('aria-valuenow')).toBe('0')
  })

  it('shows both images in one box of the photo’s aspect ratio', () => {
    const wrapper = mountSlider()
    expect(wrapper.findAll('img').map((img) => img.attributes('src'))).toEqual(['blob:before', 'blob:after'])
    expect(wrapper.get('.slider').attributes('style')).toContain('aspect-ratio: 1024 / 672')
  })
})
