import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Note {
  id: string;
  title: string;
  content: any;
  updated_at: string;
}

interface Block {
  id: string;
  type: 'text' | 'h1' | 'h2' | 'h3';
  content: string;
}

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([{ id: crypto.randomUUID(), type: 'text', content: '' }]);
  const [title, setTitle] = useState('');
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  // Fetch notes
  useEffect(() => {
    if (!token) return;
    fetch('http://localhost:3000/api/notes', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
        if (res.status === 401) {
            logout();
            return [];
        }
        return res.json();
    })
    .then(data => {
        if (Array.isArray(data)) setNotes(data);
    })
    .catch(console.error);
  }, [token]);

  const generateId = () => {
    return crypto.randomUUID();
  };

  const createNote = async () => {
    if (!token) return;
    const initialBlocks = [{ id: generateId(), type: 'text', content: "" }];
    const newNote = { title: "Untitled", content: initialBlocks };
    
    try {
        const res = await fetch('http://localhost:3000/api/notes', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify(newNote)
        });
        
        if (res.ok) {
            const savedNote = await res.json();
            setNotes([savedNote, ...notes]);
            selectNote(savedNote);
        } else {
            console.error("Failed to create note:", await res.text());
        }
    } catch (e) {
        console.error("Error creating note:", e);
    }
  };

  const selectNote = (note: Note) => {
    setSelectedNote(note);
    setTitle(note.title);
    try {
        let content = note.content;
        if (typeof content === 'string') {
            try {
                content = JSON.parse(content);
            } catch {
                content = null;
            }
        }
        
        if (Array.isArray(content) && content.length > 0) {
            // Ensure every block has an ID and type
            const safeBlocks = content.map((b: any) => ({
                id: b.id || generateId(),
                type: b.type || 'text',
                content: b.content || ''
            }));
            setBlocks(safeBlocks);
        } else {
            setBlocks([{ id: generateId(), type: 'text', content: '' }]);
        }
    } catch (e) {
        console.error("Error parsing note content:", e);
        setBlocks([{ id: generateId(), type: 'text', content: '' }]);
    }
  };

  const saveNote = async () => {
    if (!selectedNote || !token) return;
    
    // Optimistic update
    const updated = { ...selectedNote, title, content: blocks };
    setNotes(notes.map(n => n.id === updated.id ? updated : n));

    await fetch(`http://localhost:3000/api/notes/${selectedNote.id}`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ title, content: blocks })
    });
  };

  const updateBlock = (id: string, content: string) => {
    setBlocks(prev => prev.map(b => {
        if (b.id !== id) return b;
        
        if (b.type === 'text') {
            if (content === '# ') return { ...b, type: 'h1', content: '' };
            if (content === '## ') return { ...b, type: 'h2', content: '' };
            if (content === '### ') return { ...b, type: 'h3', content: '' };
        }
        
        return { ...b, content };
    }));
  };

  const addBlock = (index: number) => {
    const newBlock: Block = { id: generateId(), type: 'text', content: '' };
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    setBlocks(newBlocks);
  };

  const removeBlock = (index: number) => {
    if (blocks.length <= 1) return;
    const newBlocks = [...blocks];
    newBlocks.splice(index, 1);
    setBlocks(newBlocks);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addBlock(index);
    } else if (e.key === 'Backspace' && blocks[index].content === '') {
      if (blocks[index].type !== 'text') {
          e.preventDefault();
          setBlocks(prev => prev.map((b, i) => i === index ? { ...b, type: 'text' } : b));
      } else {
          e.preventDefault();
          removeBlock(index);
      }
    }
  };

  return (
    <div className="notes-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
            <button className="back-btn" onClick={() => navigate('/')}>←</button>
            <h3>Notes</h3>
            <button className="add-btn" onClick={createNote}>+</button>
        </div>
        <ul className="notes-list">
          {notes.map(note => (
            <li key={note.id} 
                className={selectedNote?.id === note.id ? 'active' : ''}
                onClick={() => selectNote(note)}>
              {note.title || "Untitled"}
            </li>
          ))}
        </ul>
      </aside>
      <main className="editor">
        {selectedNote ? (
          <>
            <input 
              className="title-input"
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              onBlur={saveNote}
              placeholder="Untitled"
            />
            <div className="blocks-container">
              {blocks.map((block, index) => (
                <div key={block.id} className="block-wrapper">
                    <input
                        className={`block-input type-${block.type}`}
                        value={block.content || ''}
                        onChange={e => updateBlock(block.id, e.target.value)}
                        onKeyDown={e => handleKeyDown(e, index)}
                        onBlur={saveNote}
                        placeholder={block.type === 'text' ? "Type '/' for commands" : `Heading ${block.type.replace('h', '')}`}
                        autoFocus={index === blocks.length - 1} 
                    />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state">Select a note or create a new one.</div>
        )}
      </main>
    </div>
  );
}
