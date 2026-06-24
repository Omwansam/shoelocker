import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchAdminStorefrontBrands,
  updateAdminStorefrontBrand,
  uploadAdminStorefrontBrandImage,
} from '../../utils/api.js';
import { AdminPage } from '../../components/admin/ui/AdminPage.jsx';
import { AdminPageHeader } from '../../components/admin/ui/AdminPageHeader.jsx';
import { AdminCard } from '../../components/admin/ui/AdminCard.jsx';
import { AdminAlert } from '../../components/admin/ui/AdminAlert.jsx';
import { AdminButton } from '../../components/admin/ui/AdminButton.jsx';
import { AdminInput } from '../../components/admin/ui/AdminInput.jsx';
import { AdminLoading } from '../../components/admin/ui/AdminLoading.jsx';
import {
  AdminTable,
  AdminTableBody,
  AdminTableHead,
  AdminTd,
  AdminTh,
} from '../../components/admin/ui/AdminTable.jsx';
import { productDisplayImage } from '../../utils/productImages.js';

export function AdminBrands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [uploadingId, setUploadingId] = useState(null);
  const fileRef = useRef(null);
  const uploadTargetRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await fetchAdminStorefrontBrands();
      setBrands(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load brands');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveField(brand, field, value) {
    try {
      const payload = { [field]: value };
      const updated = await updateAdminStorefrontBrand(brand.brandId, payload);
      setBrands((prev) =>
        prev.map((b) => (b.brandId === brand.brandId ? { ...b, ...updated } : b)),
      );
      setMessage(`Updated ${brand.label}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  }

  function triggerUpload(brand) {
    uploadTargetRef.current = brand.brandId;
    fileRef.current?.click();
  }

  async function onFileChange(e) {
    const file = e.target.files?.[0];
    const brandId = uploadTargetRef.current;
    e.target.value = '';
    if (!file || !brandId) return;

    setUploadingId(brandId);
    setError('');
    try {
      const updated = await uploadAdminStorefrontBrandImage(brandId, file);
      setBrands((prev) =>
        prev.map((b) => (b.brandId === brandId ? { ...b, ...updated } : b)),
      );
      setMessage('Shoe icon image uploaded');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingId(null);
    }
  }

  const featured = brands.filter((b) => b.isFeatured).slice(0, 3);
  const wall = brands.filter((b) => !b.isFeatured);

  return (
    <AdminPage>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        onChange={onFileChange}
      />

      <AdminPageHeader
        title="Brand wall"
        description="Manage the three featured brand cards and GOAT-style shoe icons on the homepage. Upload a side-profile product shot per brand — PNG cutouts work best."
      />

      {error ? <AdminAlert>{error}</AdminAlert> : null}
      {message ? <AdminAlert tone="success">{message}</AdminAlert> : null}

      {loading ? (
        <AdminLoading label="Loading brands…" />
      ) : (
        <>
          <AdminCard title="Featured cards (always 3)" subtitle="Large hero tiles above the shoe wall">
            <AdminTable>
              <AdminTableHead>
                <tr>
                  <AdminTh>Preview</AdminTh>
                  <AdminTh>Label</AdminTh>
                  <AdminTh>Catalog filter</AdminTh>
                  <AdminTh>Tagline</AdminTh>
                  <AdminTh>Image</AdminTh>
                </tr>
              </AdminTableHead>
              <AdminTableBody>
                {featured.map((brand) => (
                  <tr key={brand.brandId}>
                    <AdminTd>
                      <img
                        src={productDisplayImage(brand.image)}
                        alt=""
                        className="h-14 w-20 rounded-lg border border-neutral-200 bg-neutral-100 object-contain p-1"
                      />
                    </AdminTd>
                    <AdminTd className="font-semibold">{brand.label}</AdminTd>
                    <AdminTd>
                      <AdminInput
                        defaultValue={brand.catalogBrand}
                        onBlur={(e) =>
                          saveField(brand, 'catalogBrand', e.target.value.trim())
                        }
                      />
                    </AdminTd>
                    <AdminTd>
                      <AdminInput
                        defaultValue={brand.tagline}
                        onBlur={(e) => saveField(brand, 'tagline', e.target.value)}
                      />
                    </AdminTd>
                    <AdminTd>
                      <div className="flex flex-col gap-2">
                        <AdminInput
                          defaultValue={brand.image}
                          placeholder="Image URL"
                          onBlur={(e) => saveField(brand, 'image', e.target.value.trim())}
                        />
                        <AdminButton
                          type="button"
                          variant="secondary"
                          disabled={uploadingId === brand.brandId}
                          onClick={() => triggerUpload(brand)}
                        >
                          {uploadingId === brand.brandId ? 'Uploading…' : 'Upload image'}
                        </AdminButton>
                      </div>
                    </AdminTd>
                  </tr>
                ))}
              </AdminTableBody>
            </AdminTable>
          </AdminCard>

          <AdminCard
            className="mt-6"
            title="Shoe icon wall"
            subtitle="One clickable shoe image per brand — links to that brand's catalog"
          >
            <AdminTable>
              <AdminTableHead>
                <tr>
                  <AdminTh>Icon</AdminTh>
                  <AdminTh>Brand</AdminTh>
                  <AdminTh>Catalog filter</AdminTh>
                  <AdminTh>Sort</AdminTh>
                  <AdminTh>Image URL / upload</AdminTh>
                </tr>
              </AdminTableHead>
              <AdminTableBody>
                {wall.map((brand) => (
                  <tr key={brand.brandId}>
                    <AdminTd>
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-neutral-200 bg-[#fafafa] p-2">
                        <img
                          src={productDisplayImage(brand.image)}
                          alt=""
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    </AdminTd>
                    <AdminTd className="font-semibold">{brand.label}</AdminTd>
                    <AdminTd>
                      <AdminInput
                        defaultValue={brand.catalogBrand}
                        onBlur={(e) =>
                          saveField(brand, 'catalogBrand', e.target.value.trim())
                        }
                      />
                    </AdminTd>
                    <AdminTd>
                      <AdminInput
                        type="number"
                        className="w-20"
                        defaultValue={brand.wallOrder ?? 0}
                        onBlur={(e) =>
                          saveField(brand, 'wallOrder', Number(e.target.value) || 0)
                        }
                      />
                    </AdminTd>
                    <AdminTd>
                      <div className="flex flex-col gap-2">
                        <AdminInput
                          defaultValue={brand.image}
                          placeholder="https://… or uploads/…"
                          onBlur={(e) => saveField(brand, 'image', e.target.value.trim())}
                        />
                        <AdminButton
                          type="button"
                          variant="secondary"
                          disabled={uploadingId === brand.brandId}
                          onClick={() => triggerUpload(brand)}
                        >
                          {uploadingId === brand.brandId ? 'Uploading…' : 'Upload shoe icon'}
                        </AdminButton>
                      </div>
                    </AdminTd>
                  </tr>
                ))}
              </AdminTableBody>
            </AdminTable>
          </AdminCard>
        </>
      )}
    </AdminPage>
  );
}
