import React, { useState } from 'react';
import { User } from '../types';
import { db, storage } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Upload, Save, User as UserIcon } from 'lucide-react';

interface StudentProfileProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
}

const StudentProfile: React.FC<StudentProfileProps> = ({ user, onUpdateUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<User>(user);
  const [uploading, setUploading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploading(true);
      const file = e.target.files[0];
      const storageRef = ref(storage, `academic_records/${user.id}/${file.name}`);
      try {
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        setFormData({ ...formData, academicRecordsUrl: url });
      } catch (error) {
        console.error("Error uploading file:", error);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSave = async () => {
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, { ...formData });
      onUpdateUser(formData);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 flex items-center">
        <UserIcon className="mr-2" /> Student Profile
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input name="name" value={formData.name} onChange={handleInputChange} disabled={!isEditing} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Student ID Number</label>
          <input name="studentIdNumber" value={formData.studentIdNumber || ''} onChange={handleInputChange} disabled={!isEditing} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Grade Level</label>
          <input name="grade" value={formData.grade || ''} onChange={handleInputChange} disabled={!isEditing} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Program of Study</label>
          <input name="stream" value={formData.stream || ''} onChange={handleInputChange} disabled={!isEditing} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Contact Number</label>
          <input name="phoneNumber" value={formData.phoneNumber || ''} onChange={handleInputChange} disabled={!isEditing} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input name="email" value={formData.email} disabled className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-gray-100" />
        </div>
      </div>
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">Academic Records</label>
        {formData.academicRecordsUrl && (
          <a href={formData.academicRecordsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View Uploaded Record</a>
        )}
        {isEditing && (
          <input type="file" onChange={handleFileChange} disabled={uploading} className="mt-1 block w-full" />
        )}
        {uploading && <p>Uploading...</p>}
      </div>
      <div className="mt-6">
        {isEditing ? (
          <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center">
            <Save className="mr-2" /> Save Profile
          </button>
        ) : (
          <button onClick={() => setIsEditing(true)} className="bg-gray-600 text-white px-4 py-2 rounded-md">Edit Profile</button>
        )}
      </div>
    </div>
  );
};

export default StudentProfile;
