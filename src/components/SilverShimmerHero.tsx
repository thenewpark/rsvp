import { useRef, useEffect, Suspense } from 'react'
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber'
import { useTexture, shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

// ── Shader Material ────────────────────────────────────────────────────────────

const ShimmerMaterial = shaderMaterial(
  { uTexture: null as THREE.Texture | null, uTime: 0, uScroll: 0 },
  /* vertex */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* fragment */ `
    precision mediump float;

    uniform sampler2D uTexture;
    uniform float uTime;
    uniform float uScroll;
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    void main() {
      vec4 tex = texture2D(uTexture, vUv);
      float gray = dot(tex.rgb, vec3(0.299, 0.587, 0.114));

      // Diagonal shimmer band — sweeps top-left → bottom-right
      float diagonal = vUv.x * 0.6 + vUv.y * 0.4;
      float wave = sin(diagonal * 5.0 - uTime * 0.28) * 0.5 + 0.5;
      wave = pow(wave, 3.0);                       // narrow specular peak

      // Silver ink: reflects on lighter areas only
      float lightMask = smoothstep(0.2, 0.9, gray);
      float shimmer = wave * lightMask * 0.22;

      // Scroll boosts shimmer briefly
      shimmer += uScroll * lightMask * 0.14;

      // Fine grain → ink texture
      float grain = hash(vUv * 800.0 + uTime * 0.05) * 0.014;

      // Cool-white specular highlight (silver foil)
      vec3 silverTint = vec3(0.93, 0.94, 0.97);
      vec3 finalColor = mix(tex.rgb, silverTint, clamp(shimmer, 0.0, 1.0)) + grain;

      gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
    }
  `
)

extend({ ShimmerMaterial })

declare module '@react-three/fiber' {
  interface ThreeElements {
    shimmerMaterial: JSX.IntrinsicElements['shaderMaterial'] & {
      uTexture?: THREE.Texture | null
      uTime?: number
      uScroll?: number
    }
  }
}

// ── Inner mesh — lives inside Canvas ──────────────────────────────────────────

function ShimmerMesh({
  imageSrc,
  scrollRef,
}: {
  imageSrc: string
  scrollRef: React.MutableRefObject<number>
}) {
  const texture = useTexture(imageSrc)
  const matRef = useRef<InstanceType<typeof ShimmerMaterial>>(null)
  // viewport gives correct world-space dimensions matching the camera frustum
  const { viewport } = useThree()

  useFrame(({ clock }) => {
    const mat = matRef.current
    if (!mat) return
    mat.uniforms.uTime.value = clock.getElapsedTime()
    mat.uniforms.uScroll.value = THREE.MathUtils.lerp(
      mat.uniforms.uScroll.value,
      scrollRef.current,
      0.08
    )
    scrollRef.current = THREE.MathUtils.lerp(scrollRef.current, 0, 0.05)
  })

  return (
    // scale fills the entire orthographic viewport exactly
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shimmerMaterial ref={matRef} uTexture={texture} uTime={0} uScroll={0} />
    </mesh>
  )
}

// ── Public component ───────────────────────────────────────────────────────────

export default function SilverShimmerHero({
  imageSrc,
  aspectRatio = 3 / 4,
}: {
  imageSrc: string
  aspectRatio?: number
}) {
  const scrollRef = useRef(0)

  useEffect(() => {
    let lastY = window.scrollY
    const onScroll = () => {
      scrollRef.current = Math.min(Math.abs(window.scrollY - lastY) / 8, 1)
      lastY = window.scrollY
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div style={{ width: '100%', aspectRatio: String(aspectRatio) }}>
      <Canvas
        orthographic
        camera={{ position: [0, 0, 1], zoom: 1 }}
        dpr={[1, 2]}
        gl={{ antialias: false, powerPreference: 'low-power', alpha: false }}
        style={{ display: 'block', width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <ShimmerMesh imageSrc={imageSrc} scrollRef={scrollRef} />
        </Suspense>
      </Canvas>
    </div>
  )
}
