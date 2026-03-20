import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  original_tz: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  transparency: 'opaque' | 'transparent';
  visibility: 'public' | 'private' | 'confidential';
}

export default function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  
  // View State: Default to 'Week' or 'Day' view as requested for detailed scheduling
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  // Default new event to next full hour
  const defaultStart = new Date();
  defaultStart.setMinutes(0, 0, 0);
  defaultStart.setHours(defaultStart.getHours() + 1);
  const defaultEnd = new Date(defaultStart);
  defaultEnd.setHours(defaultEnd.getHours() + 1);

  // Helper to format Date to input datetime-local string (YYYY-MM-DDTHH:mm)
  const toLocalISOString = (date: Date) => {
    const pad = (n: number) => n < 10 ? '0' + n : n;
    return date.getFullYear() +
        '-' + pad(date.getMonth() + 1) +
        '-' + pad(date.getDate()) +
        'T' + pad(date.getHours()) +
        ':' + pad(date.getMinutes());
  };

  const [newEventStart, setNewEventStart] = useState(toLocalISOString(defaultStart));
  const [newEventEnd, setNewEventEnd] = useState(toLocalISOString(defaultEnd));

  const createEvent = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!token) return;

      const payload = {
          title: newEventTitle,
          start_time: new Date(newEventStart).toISOString(),
          end_time: new Date(newEventEnd).toISOString(),
          original_tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
          status: 'confirmed',
          transparency: 'opaque',
          visibility: 'private'
      };

      try {
          const res = await fetch(`${API_URL}/api/calendar/events`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
              },
              body: JSON.stringify(payload)
          });

          if (res.ok) {
              const savedEvent = await res.json();
              setEvents([...events, savedEvent]);
              setIsModalOpen(false);
              setNewEventTitle("");
          } else {
              const errorText = await res.text();
              alert(`Failed to create event: ${errorText}`);
          }
      } catch (err) {
          console.error(err);
      }
  };


  useEffect(() => {
    if (!token) return;
    
    // Calculate start/end of the current view for Lazy Loading
    const start = new Date(currentDate);
    start.setHours(0, 0, 0, 0); // Start of day
    // TODO: Adjust for week/month view logic

    // Fetch Schedule
    fetch(`${API_URL}/api/calendar/events`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
        setEvents(data);
        setLoading(false);
    })
    .catch(err => {
        console.error("Failed to load calendar events", err);
        setLoading(false);
    });
  }, [token, currentDate, viewMode]);

  const handlePrev = () => {
      const newDate = new Date(currentDate);
      if (viewMode === 'day') newDate.setDate(newDate.getDate() - 1);
      if (viewMode === 'week') newDate.setDate(newDate.getDate() - 7);
      if (viewMode === 'month') newDate.setMonth(newDate.getMonth() - 1);
      setCurrentDate(newDate);
  };

  const handleNext = () => {
      const newDate = new Date(currentDate);
      if (viewMode === 'day') newDate.setDate(newDate.getDate() + 1);
      if (viewMode === 'week') newDate.setDate(newDate.getDate() + 7);
      if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + 1);
      setCurrentDate(newDate);
  };

  return (
    <div className="calendar-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column', color: '#e2e8f0', backgroundColor: '#0f172a' }}>
      {/* Heavy Header */}
      <header style={{ padding: '20px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Calendar</h1>
            <div className="view-controls" style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setViewMode('day')} style={{ padding: '5px 10px', background: viewMode === 'day' ? '#3b82f6' : '#1e293b', border: 'none', borderRadius: '4px', color: 'white' }}>Day</button>
                <button onClick={() => setViewMode('week')} style={{ padding: '5px 10px', background: viewMode === 'week' ? '#3b82f6' : '#1e293b', border: 'none', borderRadius: '4px', color: 'white' }}>Week</button>
                <button onClick={() => setViewMode('month')} style={{ padding: '5px 10px', background: viewMode === 'month' ? '#3b82f6' : '#1e293b', border: 'none', borderRadius: '4px', color: 'white' }}>Month</button>
            </div>
        </div>
        <div className="nav-controls" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
             <button onClick={() => setIsModalOpen(true)} style={{ background: '#22c55e', border: 'none', color: 'white', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>+ Event</button>
             <button onClick={handlePrev} style={{ background: 'none', border: '1px solid #334155', color: 'white', padding: '5px 10px', borderRadius: '4px' }}>&lt;</button>
             <span style={{ fontWeight: 'bold' }}>{currentDate.toDateString()}</span>
             <button onClick={handleNext} style={{ background: 'none', border: '1px solid #334155', color: 'white', padding: '5px 10px', borderRadius: '4px' }}>&gt;</button>
        </div>
      </header>

      {/* Main Content: Layered Rendering */}
      <div className="calendar-grid" style={{ flex: 1, position: 'relative', overflowY: 'auto', display: 'flex' }}>
         {/* Simple Time Gutter */}
         <div style={{ width: '60px', borderRight: '1px solid #1e293b', flexShrink: 0 }}>
             {Array.from({ length: 24 }).map((_, i) => (
                 <div key={i} style={{ height: '60px', borderBottom: '1px solid #1e293b', textAlign: 'right', paddingRight: '10px', fontSize: '0.8rem', color: '#64748b' }}>
                     {i}:00
                 </div>
             ))}
         </div>

         {/* Calendar Canvas */}
         <div style={{ flex: 1, position: 'relative' }}>
             {/* Background Grid Lines */}
             {Array.from({ length: 24 }).map((_, i) => (
                 <div key={i} style={{ height: '60px', borderBottom: '1px solid #1e293b', position: 'absolute', top: `${i * 60}px`, left: 0, right: 0, pointerEvents: 'none' }}></div>
             ))}

             {/* Events Layer */}
             {events.map(event => {
                 // Simple Layout Logic (No collision handling yet)
                 const start = new Date(event.start_time);
                 const end = new Date(event.end_time);
                 
                 // Normalize to grid (assuming view starts at 00:00)
                 const startHours = start.getHours() + start.getMinutes() / 60;
                 const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

                 return (
                     <div 
                        key={event.id}
                        style={{
                            position: 'absolute',
                            top: `${startHours * 60}px`, // 60px per hour
                            height: `${durationHours * 60}px`,
                            left: '10px', // Temporary fixed width
                            right: '10px',
                            backgroundColor: 'rgba(59, 130, 246, 0.8)',
                            borderRadius: '4px',
                            padding: '5px',
                            overflow: 'hidden',
                            borderLeft: '4px solid #2563eb',
                            fontSize: '0.85rem'
                        }}
                     >
                         <div style={{ fontWeight: 'bold' }}>{event.title}</div>
                         <div>{start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                     </div>
                 );
             })}
         </div>
      </div>

      {isModalOpen && (
          <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
          }}>
              <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', width: '400px', border: '1px solid #334155' }}>
                  <h3 style={{ marginTop: 0 }}>Create Event</h3>
                  <form onSubmit={createEvent}>
                      <div style={{ marginBottom: '15px' }}>
                          <label style={{ display: 'block', marginBottom: '5px' }}>Title</label>
                          <input 
                            type="text" 
                            value={newEventTitle} 
                            onChange={e => setNewEventTitle(e.target.value)} 
                            style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '4px' }}
                            required
                          />
                      </div>
                      <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
                          <div style={{ flex: 1 }}>
                              <label style={{ display: 'block', marginBottom: '5px' }}>Start</label>
                              <input 
                                type="datetime-local" 
                                value={newEventStart}
                                onChange={e => setNewEventStart(e.target.value)}
                                style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '4px' }}
                                required
                              />
                          </div>
                      </div>
                       <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
                          <div style={{ flex: 1 }}>
                              <label style={{ display: 'block', marginBottom: '5px' }}>End</label>
                              <input 
                                type="datetime-local" 
                                value={newEventEnd}
                                onChange={e => setNewEventEnd(e.target.value)}
                                style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white', borderRadius: '4px' }}
                                required
                              />
                          </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                          <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 15px', background: 'transparent', border: '1px solid #64748b', color: '#cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                          <button type="submit" style={{ padding: '8px 15px', background: '#3b82f6', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}
