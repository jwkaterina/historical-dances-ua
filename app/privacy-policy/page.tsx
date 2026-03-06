export const metadata = {
  title: 'Privacy Policy – Historical Dances',
}

export default function PrivacyPolicyPage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px', fontFamily: 'serif', lineHeight: 1.7, color: '#3a2e24' }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Privacy Policy</h1>
      <p style={{ color: '#7d6b56', marginBottom: 32 }}>Last updated: March 2026</p>

      <h2 style={{ fontSize: 20, marginTop: 32 }}>1. Overview</h2>
      <p>
        Historical Dances ("the app") is a reference app for historical dance enthusiasts.
        We are committed to protecting your privacy. This policy explains what data we collect and how we use it.
      </p>

      <h2 style={{ fontSize: 20, marginTop: 32 }}>2. Data We Collect</h2>
      <p>
        <strong>Account data:</strong> If you create an account, we collect your email address and a hashed password,
        stored securely via Supabase.
      </p>
      <p>
        <strong>User-generated content:</strong> Authenticated users may upload dance descriptions, videos, music tracks,
        and tutorial files. This content is stored on our servers.
      </p>
      <p>
        <strong>Device storage:</strong> The app may store downloaded audio files locally on your device for offline playback.
        This data never leaves your device.
      </p>

      <h2 style={{ fontSize: 20, marginTop: 32 }}>3. Data We Do Not Collect</h2>
      <p>
        We do not collect location data, contacts, camera or microphone input, advertising identifiers,
        or any analytics beyond what Vercel provides for the web version (anonymous page views).
      </p>

      <h2 style={{ fontSize: 20, marginTop: 32 }}>4. Third-Party Services</h2>
      <p>
        The app uses <strong>Supabase</strong> for authentication and data storage, and <strong>YouTube</strong> embeds
        for video content. These services have their own privacy policies.
      </p>

      <h2 style={{ fontSize: 20, marginTop: 32 }}>5. Data Retention</h2>
      <p>
        Your account and uploaded content are retained as long as your account exists.
        You may request deletion of your account and data by contacting us.
      </p>

      <h2 style={{ fontSize: 20, marginTop: 32 }}>6. Contact</h2>
      <p>
        If you have any questions about this privacy policy, please contact us at:{' '}
        <a href="mailto:jwkaterina@gmail.com" style={{ color: '#a67c52' }}>jwkaterina@gmail.com</a>
      </p>
    </main>
  )
}
