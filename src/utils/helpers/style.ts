import { computed } from 'vue'
import { useDisplay } from 'vuetify'

export function useHeroComputed() {
    const { mobile, lgAndUp } = useDisplay()

    return computed(() => ({
        titleClass: mobile.value ? 'text-h4' : lgAndUp.value ? 'text-h2' : 'text-h3',
        subtitleClass: mobile.value ? 'text-body-1' : 'text-h6',
        contentTitleClass: mobile.value ? 'text-h5' : lgAndUp.value ? 'text-h2' : 'text-h3',
        sectionTitleClass: mobile.value ? 'text-h6' : 'text-h5',
        bodyTextClass: mobile.value ? 'text-body-2' : 'text-body-1',
        cardPadding: mobile.value ? 'pa-4' : 'pa-6',
    }))
}