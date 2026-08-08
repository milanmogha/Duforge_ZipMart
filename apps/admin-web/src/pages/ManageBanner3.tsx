import React, { useState, useEffect } from 'react';
import { fetchBanner3s, addBanner3, deleteBanner3 } from '../api';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { FaPhotoVideo, FaTrash, FaInfoCircle } from 'react-icons/fa';
import { BANNER_3, validateBannerFile } from '../utils/bannerValidation';

const ManageBanner3: React.FC = () => {
  const [banner3s, setBanner3s] = useState<any[]>([]);
  const [newBanner, setNewBanner] = useState<File | null>(null);
  const [bannerText, setBannerText] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    loadBanner3s();
  }, []);

  const loadBanner3s = async () => {
    try {
      const data = await fetchBanner3s();
      setBanner3s(data);
    } catch (error) {
      console.error('Error fetching banner3s:', error);
    }
  };

  const handleAddBanner = async () => {
    if (!newBanner) {
      setUploadError('Please upload a banner image');
      return;
    }

    // Enforce the exact fixed dimensions.
    const error = await validateBannerFile(newBanner, BANNER_3);
    if (error) {
      setUploadError(error);
      return;
    }

    const formData = new FormData();
    formData.append('image', newBanner);
    formData.append('text', bannerText);

    try {
      await addBanner3(formData);
      setNewBanner(null);
      setBannerText('');
      setUploadError('');
      loadBanner3s(); // Refresh banner3 list
    } catch (error) {
      console.error('Error adding banner3:', error);
      setUploadError('Failed to add banner. Please try again.');
    }
  };

  const handleDeleteBanner = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget._id;
    setDeleteTarget(null);

    try {
      await deleteBanner3(id);
      loadBanner3s(); // Refresh banner3 list
    } catch (error) {
      console.error('Error deleting banner3:', error);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Manage Banner 3"
        subtitle="Third carousel banners shown on the customer home screen"
      />

      {/* Banner3 List */}
      <div className="mb-8">
        {banner3s.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {banner3s.map((banner: any) => (
              <Card
                key={banner._id}
                className="transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                <img
                  src={banner.image}
                  alt="Banner3"
                  className="mb-4 aspect-[2/1] w-full rounded-lg border border-slate-100 object-cover"
                />
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-slate-700">
                    {banner.text || "No text"}
                  </p>
                  <Badge tone="neutral">800 × 400</Badge>
                </div>
                <div className="mt-4">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setDeleteTarget(banner)}
                  >
                    <FaTrash size={12} /> Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState message="No banners yet. Add one below." />
        )}
      </div>

      {/* Add New Banner3 */}
      <Card
        title="Add New Banner 3"
        subtitle="Fixed size for this banner slot"
        actions={<Badge tone="info">800 × 400 px</Badge>}
      >
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
          <FaInfoCircle className="mt-0.5 shrink-0" />
          <p>
            Upload only an <strong>800 × 400</strong> pixel image (2:1 ratio).
            Images of any other size will be rejected so the banner never gets
            cropped on the customer home screen. Max file size: 1 MB.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Banner Text">
            <input
              type="text"
              className="input-base"
              placeholder="Optional caption"
              value={bannerText}
              onChange={(e) => setBannerText(e.target.value)}
            />
          </Field>
          <Field label="Banner Image" hint="Exactly 800 × 400 px, max 1 MB" required>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                setUploadError('');
                setNewBanner(e.target.files ? e.target.files[0] : null);
              }}
              className="input-base file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-indigo-600 hover:file:bg-indigo-100"
            />
          </Field>
        </div>

        {uploadError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {uploadError}
          </div>
        )}

        <div className="mt-5">
          <Button variant="primary" onClick={handleAddBanner}>
            <FaPhotoVideo size={14} /> Add Banner 3
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete this banner?"
        message="Are you sure you want to delete this banner?"
        confirmLabel="Delete"
        onConfirm={handleDeleteBanner}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default ManageBanner3;
