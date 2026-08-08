import React, { useState, useEffect } from 'react';
import { fetchBanners, addBanner, deleteBanner } from '../api';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { FaImage, FaTrash, FaInfoCircle } from 'react-icons/fa';
import { BANNER_1, validateBannerFile } from '../utils/bannerValidation';

const ManageBanners: React.FC = () => {
  // Explicitly type banners as any[] to avoid the 'never[]' inference
  const [banners, setBanners] = useState<any[]>([]);
  const [newBanner, setNewBanner] = useState<File | null>(null);
  const [bannerText, setBannerText] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      const data = await fetchBanners();
      setBanners(data);
    } catch (error) {
      console.error('Error fetching banners:', error);
    }
  };

  const handleAddBanner = async () => {
    if (!newBanner) {
      setUploadError('Please upload a banner image');
      return;
    }

    // Enforce the exact fixed dimensions.
    const error = await validateBannerFile(newBanner, BANNER_1);
    if (error) {
      setUploadError(error);
      return;
    }

    const formData = new FormData();
    formData.append('image', newBanner);
    formData.append('text', bannerText);

    try {
      await addBanner(formData);
      setNewBanner(null);
      setBannerText('');
      setUploadError('');
      loadBanners(); // Refresh banners
    } catch (error) {
      console.error('Error adding banner:', error);
      setUploadError('Failed to add banner. Please try again.');
    }
  };

  const handleDeleteBanner = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget._id;
    setDeleteTarget(null);

    try {
      await deleteBanner(id);
      loadBanners(); // Refresh banners
    } catch (error) {
      console.error('Error deleting banner:', error);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Manage Banners"
        subtitle="Main rotating banner shown on the customer home screen (hero)"
      />

      {/* Banner List */}
      <div className="mb-8">
        {banners.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {banners.map((banner: any) => (
              <Card
                key={banner._id}
                className="transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                <img
                  src={banner.image}
                  alt="Banner"
                  className="mb-4 aspect-[2/1] w-full rounded-lg border border-slate-100 object-cover"
                />
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-slate-700">
                    {banner.text || "No text"}
                  </p>
                  <Badge tone="neutral">1200 × 600</Badge>
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

      {/* Add New Banner */}
      <Card
        title="Add New Banner"
        subtitle="Fixed size for this banner slot"
        actions={<Badge tone="info">1200 × 600 px</Badge>}
      >
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
          <FaInfoCircle className="mt-0.5 shrink-0" />
          <p>
            Upload only a <strong>1200 × 600</strong> pixel image (2:1 ratio).
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
          <Field label="Banner Image" hint="Exactly 1200 × 600 px, max 1 MB" required>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                setUploadError('');
                const file = e.target.files ? e.target.files[0] : null;
                setNewBanner(file);
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
            <FaImage size={14} /> Add Banner
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

export default ManageBanners;
