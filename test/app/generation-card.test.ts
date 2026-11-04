import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import GenerationCard from '~/components/generate/GenerationCard.vue'

const mountCard = (secondsLeft: number) =>
  mount(GenerationCard, {
    props: { photoUrl: 'blob:p', styleLabel: 'Japandi', progress: { ratio: 0.3, stage: 1, secondsLeft } },
    global: { stubs: { AppIcon: true } },
  })

describe('GenerationCard', () => {
  it('announces the stage to screen readers, not the ticking countdown', () => {
    const wrapper = mountCard(12)
    expect(wrapper.attributes('aria-live')).toBeUndefined()
    const live = wrapper.findAll('[aria-live]')
    expect(live).toHaveLength(1)
    expect(live[0]!.text()).toContain('Placing furniture')
    expect(live[0]!.text()).not.toMatch(/second/)
  })
})
