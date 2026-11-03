import { useState } from 'react'

export default function Search() {
  const [query, setQuery] = useState('')

  return (
    <div>
      <h2>Elokuvahaku</h2>
      
      
      <div style={{ marginTop: '20px' }}>
        <input 
          type="text" 
          placeholder="Kirjoita elokuvan nimi..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ padding: '8px', width: '300px', marginRight: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button style={{ padding: '8px 16px', cursor: 'pointer' }}>Hae</button>
      </div>
    </div>
  )
}