import { useState, useEffect, useRef } from 'react';
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
  content: string;
}

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([{ id:  Math.random().toString(36).substring(2), content: '' }]);
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
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  const createNote = async () => {
    if (!token) return;
    const initialBlocks = [{ id: generateId(), content: "" }];
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
            // Ensure every block has an ID
            const safeBlocks = content.map((b: any) => ({
                id: b.id || generateId(),
                content: b.content || ''
            }));
            setBlocks(safeBlocks);
        } else {
            setBlocks([{ id: generateId(), content: '' }]);
        }
    } catch (e) {
        console.error("Error parsing note content:", e);
        setBlocks([{ id: generateId(), content: '' }]);
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
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b));
  };

  const addBlock = (index: number) => {
    const newBlock = { id: generateId(), content: '' };
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
      e.preventDefault(); // preventing default backspace is important here
      removeBlock(index);
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
                        className="block-input"
                        value={block.content || ''}
                        onChange={e => updateBlock(block.id, e.target.value)}
                        onKeyDown={e => handleKeyDown(e, index)}
                        onBlur={saveNote}
                        placeholder="Type '/' for commands"
                        autoFocus={index === blocks.length - 1} // Auto-focus on new blocks
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
