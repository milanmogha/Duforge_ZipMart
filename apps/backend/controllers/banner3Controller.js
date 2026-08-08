import Banner3 from "../models/Banner3.js";

// Fetch all banner3s
export const getBanner3s = async (req, res) => {
  try {
    const banners = await Banner3.find().sort({ createdAt: -1 });
    const formattedBanners = banners.map((banner) => ({
      ...banner.toObject(),
      image: `data:${banner.image.contentType};base64,${banner.image.data.toString('base64')}`,
    }));
    res.status(200).json(formattedBanners);
  } catch (error) {
    console.error('Error fetching banner3s:', error.message);
    res.status(500).json({ message: 'Failed to fetch banner3s' });
  }
};

// Add a new banner3
export const addBanner3 = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Banner3 image is required' });
    }

    const { text } = req.body;

    const banner = new Banner3({
      image: {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      },
      text,
    });

    await banner.save();
    res.status(201).json({ message: 'Banner3 added successfully', banner });
  } catch (error) {
    console.error('Error adding banner3:', error.message);
    res.status(500).json({ message: 'Failed to add banner3' });
  }
};

// Delete a banner3
export const deleteBanner3 = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner3.findByIdAndDelete(id);

    if (!banner) {
      return res.status(404).json({ message: 'Banner3 not found' });
    }

    res.status(200).json({ message: 'Banner3 deleted successfully' });
  } catch (error) {
    console.error('Error deleting banner3:', error.message);
    res.status(500).json({ message: 'Failed to delete banner3' });
  }
};