import { useDisplay } from 'vuetify';
import { ref, onMounted, onUnmounted } from 'vue';
import { attachOrbitToScroll } from '@/views/landing/modelHelper'
import { useHeroComputed } from '@/utils/helpers/style';

interface AboutPageProps {
    orbitals: string[]
}

export function useAbout(props: AboutPageProps) {
    const heroComputed = useHeroComputed()
    // states
    const isVisible = ref(false)
    const countersVisible = ref(false)
    const animatedYears = ref(0)
    const animatedProjects = ref(0)
    const animatedSatisfaction = ref(0)
    const cameraOrbit = ref('-76.81deg 80.14deg 20.35m')
    const { mobile, lgAndUp } = useDisplay()

    const [orbitalA, orbitalB] = props.orbitals.map((orbital) => orbital)

    function animateCounters() {
        const DURATION = 1000
        const STEPS = 30
        const STEP_TIME = Math.max(8, Math.floor(DURATION / STEPS))

        let currentStep = 0
        const timer = setInterval(() => {
            currentStep++
            const progress = Math.min(1, currentStep / STEPS)

            animatedYears.value = Math.round(27 * progress)
            animatedProjects.value = Math.round(116 * progress)
            animatedSatisfaction.value = Math.round(98 * progress)

            if (currentStep >= STEPS) {
                animatedYears.value = 27
                animatedProjects.value = 116
                animatedSatisfaction.value = 98
                clearInterval(timer)
            }
        }, STEP_TIME)

        onUnmounted(() => {
            if(timer) clearInterval(timer)
        })
    }

    onMounted(() => {
        isVisible.value = true
        countersVisible.value = true
        animateCounters()

        const scrollController = attachOrbitToScroll((s) => (cameraOrbit.value = s), orbitalA, orbitalB)

        onUnmounted(() => {
            if (scrollController) scrollController.detach()
        })
    })

    return {
        mobile,
        lgAndUp,
        isVisible,
        countersVisible,
        heroComputed,
        orbitalA,
        orbitalB,
        animatedYears,
        animatedProjects,
        animatedSatisfaction,
        cameraOrbit,
    }
}



