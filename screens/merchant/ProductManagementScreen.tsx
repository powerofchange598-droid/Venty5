import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, Product } from '../../types';
import Card from '../../components/Card';
import VentyButton from '../../components/VentyButton';
import ShareModal from '../../components/ShareModal';
import MerchantPageLayout from '../../components/merchant/MerchantPageLayout';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, MagnifyingGlassIcon, CloudArrowDownIcon, CheckCircleIcon, SparklesIcon, PhotoIcon, ArrowUturnLeftIcon, CheckIcon, HashtagIcon, VideoCameraIcon, ArrowPathIcon, ChevronDownIcon, InformationCircleIcon, CalendarIcon, EyeIcon, DocumentDuplicateIcon, ShareIcon } from '@heroicons/react/24/outline';
import { useLocalization } from '../../hooks/useLocalization';
import ProductCard from '../../components/ProductCard';
import { toInputDateString, safeDate } from '../../utils/dateUtils';
import { createProduct, fetchMerchantProducts } from '../../lib/products';

interface ProductManagementScreenProps {
    user: User;
}

// --- Helper Functions ---
interface ImageFile {
    id: string;
    file: File | null;
    url: string;
    isEnhancing?: boolean;
}

// --- Preview Modal ---
const PreviewModal: React.FC<{ productData: Product, user: User, onClose: () => void }> = ({ productData, user, onClose }) => (
    <div className="fixed inset-0 bg-bg-tertiary/75 backdrop-blur-md flex justify-center items-center p-4 z-[60] animate-fadeIn" onClick={onClose}>
        <div className="w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-center text-white font-bold text-xl mb-4">Product Preview</h3>
            <ProductCard product={productData} user={user} />
        </div>
    </div>
);


// --- Inventory Management Component ---
const InventoryView: React.FC<{user: User; products: Product[]; setProducts: React.Dispatch<React.SetStateAction<Product[]>>}> = ({ user, products, setProducts }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [sharingProduct, setSharingProduct] = useState<Product | null>(null);
    const { formatCurrency } = useLocalization();
    const location = useLocation();
    const navigate = useNavigate();
    
    // Form State
    const [images, setImages] = useState<ImageFile[]>([]);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Electronics / Gadgets');
    const [price, setPrice] = useState('');
    const [originalPrice, setOriginalPrice] = useState('');
    const [stock, setStock] = useState('');
    const [description, setDescription] = useState('');
    const [isFeatured, setIsFeatured] = useState(false);
    const [publishOption, setPublishOption] = useState<'now' | 'schedule'>('now');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showPreview, setShowPreview] = useState(false);

    const handleOpenModal = (product: Product | null) => {
        setEditingProduct(product);
        if (product) {
            setTitle(product.title);
            setCategory(product.category);
            setPrice(product.price.toString());
            setOriginalPrice(product.originalPrice?.toString() || '');
            setStock(product.stock.toString());
            setDescription(product.description || '');
            setImages(product.images ? product.images.map((url, i) => ({ id: `img-${i}`, file: null, url })) : [{ id: 'img-0', file: null, url: product.imageUrl }]);
            setIsFeatured(product.isFeatured || false);
            setPublishOption(product.publishDate ? 'schedule' : 'now');
            setStartDate(toInputDateString(product.publishDate));
            setEndDate(toInputDateString(product.endDate));
        } else {
            // Reset for new product
            setTitle(''); setCategory('Electronics / Gadgets'); setPrice(''); setOriginalPrice(''); setStock(''); setDescription('');
            setImages([]); setIsFeatured(false); setPublishOption('now'); setStartDate(''); setEndDate('');
        }
        setShowPreview(false);
        setIsModalOpen(true);
    };

    // Effect to open modal via URL hash
    useEffect(() => {
        if (location.hash === '#add') {
            handleOpenModal(null);
            navigate(location.pathname, { replace: true });
        }
    }, [location.hash, navigate]);


    const handleCloseModal = () => { setIsModalOpen(false); setEditingProduct(null); };
    
    const [formError, setFormError] = useState<string | null>(null);
    const handleSubmit = async (status: 'published' | 'draft') => {
        const safeStartDate = safeDate(startDate);
        const safeEndDate = safeDate(endDate);
        const toEng = (s: string) => {
            const map: Record<string, string> = {'٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9','۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9'};
            return s.replace(/[٠-٩۰-۹]/g, d => map[d] || d);
        };
        const titleTrim = title.trim();
        const categoryTrim = category.trim();
        const priceStr = toEng(price);
        const priceVal = parseFloat(priceStr);
        if (!titleTrim) { setFormError('Product name is required.'); return; }
        if (!Number.isFinite(priceVal) || priceVal <= 0) { setFormError('Price is required and must be greater than 0.'); return; }
        if (!categoryTrim) { setFormError('Category is required.'); return; }

        const productData: Partial<Product> = { 
            title: titleTrim, category: categoryTrim, 
            price: priceVal,
            originalPrice: parseFloat(toEng(originalPrice)) || undefined,
            stock: parseInt(toEng(stock)) || 0,
            description, isFeatured,
            publishDate: publishOption === 'schedule' ? (safeStartDate ? safeStartDate.toISOString() : undefined) : new Date().toISOString(),
            endDate: publishOption === 'schedule' ? (safeEndDate ? safeEndDate.toISOString() : undefined) : undefined,
            imageUrl: images[0]?.url || 'https://picsum.photos/seed/newproduct/300/200',
            images: images.map(img => img.url),
        };
        const res = await createProduct(user, { ...productData, status });
        if (res && (res as any).ok) {
            let slug = user.merchantProfile?.slug;
            if (!slug && user.email) {
                slug = user.email.replace(/[^a-z0-9]/gi, '-');
            }
            if (slug) {
                const list = await fetchMerchantProducts(slug);
                setProducts(Array.isArray(list) ? list : []);
            }
            setFormError(null);
            handleCloseModal();
        } else {
            const message = (res?.data as any)?.message || (res as any)?.error || 'Unknown error';
            console.error('Product save failed:', { payload: productData, response: res });
            setFormError(typeof message === 'string' ? message : 'Failed to save product.');
        }
    };
    
    const handleDelete = (productId: string) => {
        if (window.confirm('Are you sure?')) setProducts(products.filter(p => p.id !== productId));
    };

    const handleDuplicate = (product: Product) => {
        const newProduct = {
            ...product,
            id: `copy-${Date.now()}`,
            title: `Copy of ${product.title}`,
        };
        setProducts(prev => [newProduct, ...prev]);
    };

    // --- Media Handlers ---
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const files = Array.from(e.target.files).slice(0, 10 - images.length);
        const toDataUrl = (file: File) =>
            new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
                reader.readAsDataURL(file);
            });
        Promise.all(files.map(f => toDataUrl(f))).then(urls => {
            const newImages = files.map((file, index) => ({ id: `new-${Date.now()}-${index}`, file, url: urls[index] }));
            setImages(prev => [...prev, ...newImages]);
        });
    };
    
    const removeImage = (id: string) => setImages(prev => prev.filter(img => img.id !== id));

    const productCategories = ['Electronics / Gadgets', 'Clothing / Apparel', 'Home & Living', 'Food / Groceries'];

    const previewProductData = {
        id: editingProduct?.id || 'preview',
        title, price: parseFloat(price) || 0, originalPrice: parseFloat(originalPrice) || undefined,
        createdAt: new Date().toISOString(), merchant: user.merchantProfile?.brandName || 'Your Store',
        imageUrl: images[0]?.url || 'https://picsum.photos/seed/placeholder/300/200', category,
        stock: parseInt(stock) || 0, ownerId: user.id, ownerName: user.name, condition: 'New' as const, isFeatured,
        merchantInfo: { id: 'merch_preview', name: user.merchantProfile?.brandName || 'Your Store', slug: user.merchantProfile?.slug || 'your-store', logoUrl: user.merchantProfile?.logoUrl || '', city: user.merchantProfile?.governorate || '', rating: 5, deliveryDays: 2, isVerified: user.merchantProfile?.isVerified || false }
    };

    const discount = useMemo(() => {
        const p = parseFloat(price);
        const op = parseFloat(originalPrice);
        if (op > p) {
            return Math.round(((op - p) / op) * 100);
        }
        return 0;
    }, [price, originalPrice]);

    const profitInfo = useMemo(() => {
        const sellingPrice = parseFloat(price) || 0;
        if (sellingPrice === 0) return null;
        
        const commission = sellingPrice * 0.05; // 5% platform commission
        let profit: number;
        let margin: number;
        let note: string;

        if (editingProduct?.isDropshipped) {
            const sourcePrice = editingProduct.sourcePrice || 0;
            profit = sellingPrice - sourcePrice - commission;
            note = '(after source price & 5% commission)';
        } else {
            profit = sellingPrice - commission;
            note = '(before cost of goods, after 5% commission)';
        }
        margin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
        return { profit, margin, note };
    }, [price, editingProduct]);

    return (
        <>
        <div className="flex justify-end">
            <VentyButton onClick={() => handleOpenModal(null)} variant="primary" className="!w-auto !py-2 !px-3 !text-sm flex items-center space-x-1">
                <PlusIcon className="h-4 w-4" />
                <span>Add Product</span>
            </VentyButton>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
            {products.map(product => (
                <Card key={product.id} className="!p-3">
                    <div className="relative">
                        <img src={product.imageUrl} alt={product.title} className="w-full h-40 object-cover rounded-lg mb-2" loading="lazy" />
                        {product.isDropshipped && (
                             <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full z-10 flex items-center space-x-1">
                                <CloudArrowDownIcon className="h-3 w-3" />
                                <span>Dropshipped</span>
                            </div>
                        )}
                    </div>
                    <h3 className="text-lg font-bold truncate mt-2">{product.title}</h3>
                    <p className="text-sm text-text-secondary">{product.category}</p>
                    <div className="flex justify-between items-center mt-2">
                        <span className="font-bold text-brand-primary">{formatCurrency(product.price)}</span>
                        <span className="text-sm font-semibold">Stock: {product.stock}</span>
                    </div>
                    <div className="flex space-x-2 mt-4">
                        <VentyButton onClick={() => setSharingProduct(product)} variant="secondary" className="!w-auto !text-sm !py-2 !px-2" title="Share"><ShareIcon className="h-4 w-4" onClick={() => {}} /></VentyButton>
                        <VentyButton onClick={() => handleDuplicate(product)} variant="secondary" className="!w-auto !text-sm !py-2 !px-2" title="Duplicate"><DocumentDuplicateIcon className="h-4 w-4" onClick={() => {}} /></VentyButton>
                        <VentyButton onClick={() => handleOpenModal(product)} variant="secondary" className="flex-grow !text-sm !py-2"><PencilIcon className="h-4 w-4 mr-1 inline" onClick={() => {}}/> Edit</VentyButton>
                        <VentyButton onClick={() => handleDelete(product.id)} variant="danger" className="!w-auto !text-sm !py-2 !px-2" title="Delete"><TrashIcon className="h-4 w-4" onClick={() => {}} /></VentyButton>
                    </div>
                </Card>
            ))}
        </div>
        
        {sharingProduct && (
            <ShareModal
                title="Share Product"
                text={`Check out this product on Venty: ${sharingProduct.title}`}
                url={`${window.location.origin}${window.location.pathname}#/product/${sharingProduct.id}?source=share&medium=merchant`}
                onClose={() => setSharingProduct(null)}
            />
        )}

        {isModalOpen && (
            <div className="fixed inset-0 bg-bg-tertiary/75 backdrop-blur-md flex justify-center items-center p-4 z-50 animate-fadeIn" onClick={handleCloseModal}>
                 {showPreview && <PreviewModal productData={previewProductData} user={user} onClose={() => setShowPreview(false)} />}
                <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col animate-cinematic-enter" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-bg-tertiary">
                        <h2 className="text-xl font-bold">{editingProduct ? 'Edit Product' : 'Create New Product'}</h2>
                        <button onClick={handleCloseModal}><XMarkIcon className="h-6 w-6" /></button>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto pr-2 -mr-2">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Media Column */}
                            <div className="space-y-4">
                                <div>
                                    <label className="font-medium block mb-1">Photos (up to 10)</label>
                                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-bg-tertiary border-dashed rounded-md">
                                        <div className="space-y-1 text-center">
                                            <PhotoIcon className="mx-auto h-12 w-12 text-text-tertiary" />
                                            <div className="flex text-sm text-text-secondary">
                                                <label htmlFor="file-upload" className="relative cursor-pointer bg-bg-secondary rounded-md font-medium text-brand-primary hover:text-blue-700">
                                                    <span>Upload files</span>
                                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="image/*" onChange={handleImageUpload} />
                                                </label>
                                                <p className="pl-1">or drag and drop</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mt-2">
                                        {images.map((image, index) => (
                                            <div key={image.id} className="relative group aspect-square">
                                                <img src={image.url} alt={title || 'Product image'} className="w-full h-full object-cover rounded-md" loading="lazy" />
                                                <button onClick={() => removeImage(image.id)} className="absolute top-1 right-1 bg-black/50 p-0.5 rounded-full opacity-0 group-hover:opacity-100"><XMarkIcon className="h-4 w-4 text-white" /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {/* Details Column */}
                            <div className="space-y-4">
                                <div><label className="font-medium">Product Title</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full mt-1 p-2 bg-bg-secondary rounded-lg border border-bg-tertiary"/></div>
                                
                                <Card className="!p-3 space-y-3">
                                    <h3 className="font-semibold">Pricing & Profit</h3>
                                    {editingProduct?.isDropshipped && (
                                        <div className="text-sm p-2 bg-blue-500/10 rounded-md">
                                            <p>Source Price: <span className="font-bold">{formatCurrency(editingProduct.sourcePrice || 0)}</span></p>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="font-medium text-sm">Selling Price ({user.currency})</label><input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full mt-1 p-2 bg-bg-secondary rounded-lg border"/></div>
                                        <div><label className="font-medium text-sm">Original Price</label><input type="number" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} className="w-full mt-1 p-2 bg-bg-secondary rounded-lg border"/></div>
                                    </div>
                                    {discount > 0 && <p className="text-sm text-center font-semibold text-feedback-success bg-feedback-success/10 p-2 rounded-md">This will show a {discount}% discount.</p>}
                                    {profitInfo && (
                                         <div className="text-sm text-center font-semibold text-feedback-info bg-feedback-info/10 p-2 rounded-md">
                                             Net Profit: {formatCurrency(profitInfo.profit)} ({profitInfo.margin.toFixed(1)}% margin) <br/>
                                             <span className="text-xs">{profitInfo.note}</span>
                                         </div>
                                    )}
                                </Card>

                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="font-medium">Category</label><select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full mt-1 p-2 bg-bg-secondary rounded-lg border">{productCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                                    <div><label className="font-medium">Stock</label><input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full mt-1 p-2 bg-bg-secondary rounded-lg border" disabled={editingProduct?.isDropshipped} title={editingProduct?.isDropshipped ? "Stock managed by supplier" : ""}/></div>
                                </div>
                                
                                <div>
                                    <label className="font-medium">Description</label>
                                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Describe your item, its condition, and any notable features." className="w-full mt-1 p-2 bg-bg-secondary rounded-lg border"></textarea>
                                </div>

                                <Card className="!p-3 space-y-3">
                                    <h3 className="font-semibold">Publishing Options</h3>
                                    <div className="flex items-center justify-between p-2 bg-bg-secondary rounded-md">
                                        <label htmlFor="feature-toggle" className="font-medium text-sm flex items-center"><SparklesIcon className="h-4 w-4 mr-2 text-brand-primary"/>Feature on store homepage</label>
                                        <input type="checkbox" id="feature-toggle" checked={isFeatured} onChange={() => setIsFeatured(!isFeatured)}/>
                                    </div>
                                    <div className="p-2 bg-bg-secondary rounded-md">
                                        <div className="flex space-x-4"><label className="flex items-center space-x-2"><input type="radio" name="publish" value="now" checked={publishOption === 'now'} onChange={() => setPublishOption('now')} /><span>Publish Immediately</span></label><label className="flex items-center space-x-2"><input type="radio" name="publish" value="schedule" checked={publishOption === 'schedule'} onChange={() => setPublishOption('schedule')} /><span>Schedule</span></label></div>
                                        {publishOption === 'schedule' && (
                                            <div className="grid grid-cols-2 gap-2 mt-2 animate-fadeIn">
                                                <div><label className="text-xs">Start Date</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-1 border rounded bg-bg-primary text-sm"/></div>
                                                <div><label className="text-xs">End Date (optional)</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-1 border rounded bg-bg-primary text-sm"/></div>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-6 pt-4 border-t border-bg-tertiary">
                        <div>
                             <VentyButton onClick={() => handleSubmit('draft')} variant="secondary" label="Save Draft"></VentyButton>
                        </div>
                        <div className="flex space-x-2">
                            <VentyButton onClick={() => setShowPreview(true)} variant="secondary" className="flex items-center space-x-1"><EyeIcon className="h-5 w-5" onClick={() => {}}/><span>Preview</span></VentyButton>
                            <VentyButton onClick={() => handleSubmit('published')} label="Publish Product"></VentyButton>
                        </div>
                    </div>
                    {formError && <div className="mt-3 text-xs text-feedback-error bg-feedback-error-bg rounded px-2 py-1">{formError}</div>}
                </Card>
            </div>
        )}
        </>
    );
};


// --- Dropshipping View Component ---
const DropshippingView: React.FC<{ user: User; onProductImport: (product: Product) => void; inventoryProductIds: string[] }> = ({ user, onProductImport, inventoryProductIds }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isImporting, setIsImporting] = useState<Product | null>(null);
    const [sellingPrice, setSellingPrice] = useState('');
    const { formatCurrency } = useLocalization();

    const handleSearch = () => { setIsLoading(true); setTimeout(() => { setSearchResults([]); setIsLoading(false); }, 1000); };
    
    const handleImport = () => {
        if (!isImporting || !sellingPrice) return;
        
        const newProduct: Product = {
            ...isImporting,
            id: `imported-${isImporting.id}`, // Create a unique ID for the inventory
            price: parseFloat(sellingPrice),
            ownerId: user.id,
            ownerName: user.merchantProfile?.brandName || user.name,
            merchantInfo: {
                id: 'merch_preview', name: user.merchantProfile?.brandName || user.name,
                slug: user.merchantProfile?.slug || 'your-store',
                logoUrl: user.merchantProfile?.logoUrl || '',
                city: user.merchantProfile?.governorate || '',
                rating: 5, deliveryDays: 10, isVerified: true
            }
        };
        onProductImport(newProduct);
        setIsImporting(null);
        setSellingPrice('');
    };
    
    const sourcePrice = isImporting?.sourcePrice || 0;
    const profit = parseFloat(sellingPrice) - sourcePrice;
    const margin = sourcePrice > 0 ? (profit / parseFloat(sellingPrice)) * 100 : 0;

    return (
        <div className="space-y-4">
            <Card><h2 className="text-xl font-bold mb-2">Find Products to Sell on AliExpress</h2><div className="flex space-x-2"><input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="e.g. 'wireless headphones'" className="w-full p-3 bg-bg-secondary rounded-lg border border-bg-tertiary"/><VentyButton onClick={handleSearch} disabled={isLoading} className="!w-auto px-4">{isLoading ? '...' : <MagnifyingGlassIcon className="h-6 w-6" onClick={() => {}} />}</VentyButton></div></Card>
            {isLoading && <div className="text-center p-8">Loading...</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {searchResults.length === 0 ? (
                    <Card className="text-center py-12 col-span-full">
                        <p className="text-text-secondary">No results found. Connect a supplier or import your own products.</p>
                    </Card>
                ) : searchResults.map(product => {
                    const isAlreadyImported = inventoryProductIds.includes(`imported-${product.id}`);
                    return (
                    <Card key={product.id} className="!p-3"><img src={product.imageUrl} alt={product.title} className="w-full h-40 object-cover rounded-lg mb-2" loading="lazy" /><h3 className="font-semibold h-12">{product.title}</h3><p className="text-sm text-text-secondary">Source Price: {formatCurrency(product.sourcePrice || 0)}</p><VentyButton onClick={() => {setIsImporting(product); setSellingPrice('')}} disabled={isAlreadyImported} className="w-full mt-4 !py-2 !text-sm">{isAlreadyImported ? (<span className="flex items-center justify-center"><CheckCircleIcon className="h-5 w-5 mr-2" /> Imported</span>) : (<span className="flex items-center justify-center"><CloudArrowDownIcon className="h-5 w-5 mr-2" /> Import to Store</span>)}</VentyButton></Card>
                )})}
            </div>
            {isImporting && (
                <div className="fixed inset-0 bg-bg-tertiary/75 backdrop-blur-md flex justify-center items-center p-4 z-50 animate-fadeIn" onClick={() => setIsImporting(null)}>
                    <Card className="w-full max-w-md animate-slideIn" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">Import Product</h2><button onClick={() => setIsImporting(null)}><XMarkIcon className="h-6 w-6" /></button></div>
                        <div className="flex space-x-4"><img src={isImporting.imageUrl} alt={isImporting.title} className="w-24 h-24 object-cover rounded-lg" loading="lazy" /><div><h3 className="font-semibold">{isImporting.title}</h3><p className="text-sm text-text-secondary">Source Price: {formatCurrency(sourcePrice)}</p></div></div>
                        <div className="mt-4"><label className="font-medium">Set Your Selling Price ({user.currency})</label><input type="number" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} className="w-full mt-1 p-2 bg-bg-secondary rounded-lg border border-bg-tertiary" /></div>
                        {parseFloat(sellingPrice) > sourcePrice && (<div className="mt-2 text-sm text-center bg-feedback-success/10 p-2 rounded-lg"><p>Profit: <span className="font-bold">{formatCurrency(profit)}</span></p><p>Margin: <span className="font-bold">{margin.toFixed(1)}%</span></p></div>)}
                        <div className="flex justify-end space-x-2 mt-4"><VentyButton onClick={() => setIsImporting(null)} variant="secondary" label="Cancel"></VentyButton><VentyButton onClick={handleImport} disabled={!sellingPrice || parseFloat(sellingPrice) <= sourcePrice} label="Confirm & Import"></VentyButton></div>
                    </Card>
                </div>
            )}
        </div>
    );
};

const ProductManagementScreen: React.FC<ProductManagementScreenProps> = ({ user }) => {
    const location = useLocation();
    const [view, setView] = useState<'inventory' | 'dropshipping'>('inventory');
    const [products, setProducts] = useState<Product[]>([]);
    
    useEffect(() => {
        if (location.hash === '#dropshipping') {
            setView('dropshipping');
        } else {
            setView('inventory');
        }
    }, [location.hash]);
    
    useEffect(() => {
        const slug = user.merchantProfile?.slug;
        if (!slug) return;
        Promise.resolve().then(async () => {
            const list = await fetchMerchantProducts(slug);
            setProducts(Array.isArray(list) ? list : []);
        });
    }, [user.merchantProfile?.slug]);

    const addProductToInventory = (newProduct: Product) => {
        setProducts(prev => [newProduct, ...prev]);
        alert(`Product "${newProduct.title}" imported successfully! You can now edit it in your inventory.`);
        setView('inventory');
    };

    return (
        <MerchantPageLayout title="Product Management">
            <div className="p-4 lg:p-6 space-y-4">
                <div className="flex justify-center bg-bg-tertiary rounded-lg p-1 mb-4">
                    <button onClick={() => setView('inventory')} className={`w-1/2 py-2 rounded-md font-semibold transition-colors ${view === 'inventory' ? 'bg-bg-secondary text-brand-primary' : 'text-text-secondary'}`}>Your Inventory</button>
                    <button onClick={() => setView('dropshipping')} className={`w-1/2 py-2 rounded-md font-semibold transition-colors ${view === 'dropshipping' ? 'bg-bg-secondary text-brand-primary' : 'text-text-secondary'}`}>AliExpress Dropshipping</button>
                </div>
                {view === 'inventory' ? <InventoryView user={user} products={products} setProducts={setProducts} /> : <DropshippingView user={user} onProductImport={addProductToInventory} inventoryProductIds={products.map(p => p.id)} />}
            </div>
        </MerchantPageLayout>
    );
};

export default ProductManagementScreen;
