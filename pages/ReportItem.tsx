import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CAMPUS_LOCATIONS, CATEGORY_OPTIONS } from '../constants';
import Button from '../components/Button';
import { Upload, AlertTriangle, X as XIcon } from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const ReportItem: React.FC = () => {
  const navigate = useNavigate();
  const { user, resendVerification, refreshUser } = useAuth();
  const [reportType, setReportType] = useState<'LOST' | 'FOUND'>('LOST');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    setIsResending(true);
    try {
      await resendVerification();
    } finally {
      setIsResending(false);
    }
  };

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [location, setLocation] = useState(CAMPUS_LOCATIONS[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress to JPEG to keep it small enough for Firestore
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
          setImagePreview(compressedBase64);
        } else {
          setImagePreview(reader.result as string);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!title.trim()) newErrors.title = 'Item name is required';
    if (!category) newErrors.category = 'Category is required';
    if (!location) newErrors.location = 'Location is required';
    if (!date) newErrors.date = 'Date is required';
    else {
      const selectedDate = new Date(date);
      const today = new Date();
      if (selectedDate > today) {
        newErrors.date = 'Date cannot be in the future';
      }
    }
    if (!description.trim()) newErrors.description = 'Description is required';
    else if (description.trim().length < 10) newErrors.description = 'Description must be at least 10 characters';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors in the form.');
      return;
    }
    setIsLoading(true);
    try {
      const reportData: any = {
        type: reportType,
        title,
        category: category as any,
        location,
        dateOccurred: date,
        description,
      };
      
      if (imagePreview) {
        // Save the base64 string directly to Firestore
        reportData.imageUrl = imagePreview;
      }

      await api.createReport(reportData);
      toast.success('Report submitted successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Failed to submit report', error);
      toast.error(error.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 font-serif tracking-tight">Report an Item</h1>
        <p className="mt-2 text-slate-600 text-lg">Please provide as much detail as possible to help us match items.</p>
      </div>

      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200 transition-opacity">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setReportType('LOST')}
            className={`flex-1 py-4 text-center text-sm font-medium ${
              reportType === 'LOST' 
                ? 'bg-red-50 text-red-700 border-b-2 border-red-500' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            I Lost Something
          </button>
          <button
            onClick={() => setReportType('FOUND')}
            className={`flex-1 py-4 text-center text-sm font-medium ${
              reportType === 'FOUND' 
                ? 'bg-green-50 text-green-700 border-b-2 border-green-500' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            I Found Something
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Item Name</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => { setTitle(e.target.value); if (errors.title) setErrors({...errors, title: ''}); }}
                placeholder="e.g. Black Dell XPS Laptop"
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 sm:text-sm border p-2 ${errors.title ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value as any); if (errors.category) setErrors({...errors, category: ''}); }}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 sm:text-sm border p-2 ${errors.category ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
              >
                {CATEGORY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <select
                value={location}
                onChange={(e) => { setLocation(e.target.value); if (errors.location) setErrors({...errors, location: ''}); }}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 sm:text-sm border p-2 ${errors.location ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
              >
                {CAMPUS_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
              </select>
              {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Date {reportType === 'LOST' ? 'Lost' : 'Found'}</label>
              <input
                type="date"
                required
                max={new Date().toISOString().split('T')[0]}
                value={date}
                onChange={(e) => { setDate(e.target.value); if (errors.date) setErrors({...errors, date: ''}); }}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 sm:text-sm border p-2 ${errors.date ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
              />
              {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <div className="relative mt-1">
                <textarea
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => { setDescription(e.target.value); if (errors.description) setErrors({...errors, description: ''}); }}
                    className={`block w-full rounded-md shadow-sm focus:ring-blue-500 sm:text-sm border p-2 ${errors.description ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`}
                    placeholder="Describe the item in detail (color, marks, contents)..."
                />
            </div>
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Image</label>
            <div 
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl transition-all cursor-pointer relative overflow-hidden ${
                isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 bg-gray-50 hover:bg-gray-100'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={!imagePreview ? triggerFileInput : undefined}
            >
              {imagePreview ? (
                <div className="relative w-full h-48">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImagePreview(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="absolute top-2 right-2 bg-slate-900/70 text-white rounded-full p-1.5 hover:bg-red-500 transition-colors focus:outline-none backdrop-blur-sm"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2 text-center">
                  <div className={`mx-auto h-14 w-14 rounded-full flex items-center justify-center ${isDragging ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-400 shadow-sm'}`}>
                    <Upload className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col items-center text-sm text-gray-600">
                    <span className="font-medium text-blue-600 hover:text-blue-500">
                      Click to upload
                    </span>
                    <span className="pl-1">or drag and drop</span>
                    <input 
                      ref={fileInputRef}
                      id="file-upload" 
                      name="file-upload" 
                      type="file" 
                      accept="image/*" 
                      className="sr-only" 
                      onChange={handleImageChange} 
                    />
                  </div>
                  <p className="text-xs text-gray-500 font-medium">PNG, JPG, GIF up to 5MB</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <Button type="submit" className="w-full py-3" isLoading={isLoading}>
              Submit {reportType === 'LOST' ? 'Lost' : 'Found'} Report
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportItem;