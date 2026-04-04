import RSVPForm from './components/RSVPForm'

export default function App() {
  return (
    <main
      className="min-h-screen min-h-dvh"
      style={{ background: '#111', display: 'flex', justifyContent: 'center' }}
    >
      <div style={{ width: '100%', maxWidth: '430px' }}>
        <RSVPForm />
      </div>
    </main>
  )
}
