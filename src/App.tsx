import RSVPForm from './components/RSVPForm'

export default function App() {
  return (
    <main
      className="app-frame min-h-screen min-h-dvh"
      style={{ background: '#111', display: 'flex', justifyContent: 'center' }}
    >
      <div className="app-shell">
        <RSVPForm />
      </div>
    </main>
  )
}
