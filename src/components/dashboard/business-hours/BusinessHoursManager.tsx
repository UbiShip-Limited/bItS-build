'use client';

import { useState, useEffect } from 'react';
import { businessHoursService, type BusinessHours, type SpecialHours } from '@/src/lib/api/services/businessHoursService';
import { Clock, Calendar, Save, X, Plus, Edit2 } from 'lucide-react';
import { toast } from '@/src/lib/toast';

export default function BusinessHoursManager() {
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([]);
  const [specialHours, setSpecialHours] = useState<SpecialHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [editingHours, setEditingHours] = useState<Partial<BusinessHours>>({});
  const [showSpecialHoursModal, setShowSpecialHoursModal] = useState(false);
  const [newSpecialHours, setNewSpecialHours] = useState<Partial<SpecialHours>>({
    date: '',
    openTime: '',
    closeTime: '',
    isClosed: false,
    reason: ''
  });

  useEffect(() => {
    loadBusinessHours();
  }, []);

  const loadBusinessHours = async () => {
    try {
      setLoading(true);
      const [hoursData, specialData] = await Promise.all([
        businessHoursService.getBusinessHours(),
        businessHoursService.getSpecialHours()
      ]);
      
      setBusinessHours(hoursData.businessHours);
      setSpecialHours(specialData);
    } catch (error) {
      console.error('Error loading business hours:', error);
      toast.error('Failed to load business hours');
    } finally {
      setLoading(false);
    }
  };

  const handleEditDay = (day: BusinessHours) => {
    setEditingDay(day.dayOfWeek);
    setEditingHours({
      openTime: day.openTime,
      closeTime: day.closeTime,
      isOpen: day.isOpen
    });
  };

  const handleSaveDay = async () => {
    if (editingDay === null) return;

    try {
      const updated = await businessHoursService.updateBusinessHours(editingDay, editingHours);
      setBusinessHours(prev => 
        prev.map(h => h.dayOfWeek === editingDay ? updated : h)
      );
      setEditingDay(null);
      toast.success('Business hours updated successfully');
    } catch (error) {
      console.error('Error updating business hours:', error);
      toast.error('Failed to update business hours');
    }
  };

  const handleCreateSpecialHours = async () => {
    try {
      const created = await businessHoursService.createSpecialHours(newSpecialHours as any);
      setSpecialHours(prev => [...prev, created]);
      setShowSpecialHoursModal(false);
      setNewSpecialHours({
        date: '',
        openTime: '',
        closeTime: '',
        isClosed: false,
        reason: ''
      });
      toast.success('Special hours created successfully');
    } catch (error) {
      console.error('Error creating special hours:', error);
      toast.error('Failed to create special hours');
    }
  };

  const handleDeleteSpecialHours = async (date: string) => {
    try {
      await businessHoursService.deleteSpecialHours(date);
      setSpecialHours(prev => prev.filter(h => h.date !== date));
      toast.success('Special hours deleted successfully');
    } catch (error) {
      console.error('Error deleting special hours:', error);
      toast.error('Failed to delete special hours');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Business Hours</h2>
          <p className="text-gray-400">Manage your shop's operating hours</p>
        </div>
        <button
          onClick={() => setShowSpecialHoursModal(true)}
          className="btn btn-primary btn-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Special Hours
        </button>
      </div>

      {/* Regular Business Hours */}
      <div className="card bg-base-200 border border-[#C9A449]/20">
        <div className="card-body">
          <h3 className="text-lg font-semibold text-white mb-4">Regular Hours</h3>
          <div className="space-y-3">
            {businessHours.map((day) => (
              <div key={day.dayOfWeek} className="flex items-center justify-between p-4 bg-base-300 rounded-lg">
                {editingDay === day.dayOfWeek ? (
                  <>
                    <div className="flex items-center gap-4 flex-1">
                      <span className="font-medium text-white w-24">
                        {businessHoursService.getDayName(day.dayOfWeek)}
                      </span>
                      <input
                        type="checkbox"
                        checked={editingHours.isOpen}
                        onChange={(e) => setEditingHours({ ...editingHours, isOpen: e.target.checked })}
                        className="checkbox checkbox-primary"
                      />
                      {editingHours.isOpen && (
                        <>
                          <input
                            type="time"
                            value={editingHours.openTime}
                            onChange={(e) => setEditingHours({ ...editingHours, openTime: e.target.value })}
                            className="input input-bordered input-sm"
                          />
                          <span className="text-gray-400">to</span>
                          <input
                            type="time"
                            value={editingHours.closeTime}
                            onChange={(e) => setEditingHours({ ...editingHours, closeTime: e.target.value })}
                            className="input input-bordered input-sm"
                          />
                        </>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleSaveDay} className="btn btn-success btn-sm">
                        <Save className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingDay(null)} className="btn btn-ghost btn-sm">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-4">
                      <span className="font-medium text-white w-24">
                        {businessHoursService.getDayName(day.dayOfWeek)}
                      </span>
                      {day.isOpen ? (
                        <span className="text-sm text-gray-400">
                          {businessHoursService.formatTime(day.openTime)} - {businessHoursService.formatTime(day.closeTime)}
                        </span>
                      ) : (
                        <span className="text-sm text-error">Closed</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleEditDay(day)}
                      className="btn btn-ghost btn-sm"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Special Hours */}
      <div className="card bg-base-200 border border-[#C9A449]/20">
        <div className="card-body">
          <h3 className="text-lg font-semibold text-white mb-4">Special Hours & Holidays</h3>
          {specialHours.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No special hours scheduled</p>
          ) : (
            <div className="space-y-3">
              {specialHours.map((special) => (
                <div key={special.id} className="flex items-center justify-between p-4 bg-base-300 rounded-lg">
                  <div>
                    <p className="font-medium text-white">
                      {new Date(special.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    <p className="text-sm text-gray-400">
                      {special.isClosed ? (
                        <span className="text-error">Closed - {special.reason}</span>
                      ) : (
                        <span>
                          {businessHoursService.formatTime(special.openTime!)} - {businessHoursService.formatTime(special.closeTime!)}
                          {special.reason && ` - ${special.reason}`}
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteSpecialHours(special.date)}
                    className="btn btn-ghost btn-sm text-error"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Special Hours Modal */}
      {showSpecialHoursModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Add Special Hours</h3>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Date</span>
                </label>
                <input
                  type="date"
                  value={newSpecialHours.date}
                  onChange={(e) => setNewSpecialHours({ ...newSpecialHours, date: e.target.value })}
                  className="input input-bordered"
                />
              </div>

              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Shop is closed this day</span>
                  <input
                    type="checkbox"
                    checked={newSpecialHours.isClosed}
                    onChange={(e) => setNewSpecialHours({ ...newSpecialHours, isClosed: e.target.checked })}
                    className="checkbox checkbox-primary"
                  />
                </label>
              </div>

              {!newSpecialHours.isClosed && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Open Time</span>
                    </label>
                    <input
                      type="time"
                      value={newSpecialHours.openTime ?? ''}
                      onChange={(e) => setNewSpecialHours({ ...newSpecialHours, openTime: e.target.value })}
                      className="input input-bordered"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Close Time</span>
                    </label>
                    <input
                      type="time"
                      value={newSpecialHours.closeTime ?? ''}
                      onChange={(e) => setNewSpecialHours({ ...newSpecialHours, closeTime: e.target.value })}
                      className="input input-bordered"
                    />
                  </div>
                </div>
              )}

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Reason (optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Holiday, Special Event"
                  value={newSpecialHours.reason}
                  onChange={(e) => setNewSpecialHours({ ...newSpecialHours, reason: e.target.value })}
                  className="input input-bordered"
                />
              </div>
            </div>

            <div className="modal-action">
              <button onClick={handleCreateSpecialHours} className="btn btn-primary">
                <Calendar className="w-4 h-4 mr-2" />
                Save Special Hours
              </button>
              <button onClick={() => setShowSpecialHoursModal(false)} className="btn btn-ghost">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}