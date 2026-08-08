import Banner2 from "../models/Banner2.js";

// Fetch all banner2s
export const getBanner2s = async (req, res) => {
  try {
    const banners = await Banner2.find().sort({ createdAt: -1 });
    const formattedBanners = banners.map((banner) => ({
      ...banner.toObject(),
      image: `data:${banner.image.contentType};base64,${banner.image.data.toString('base64')}`,
    }));
    res.status(200).json(formattedBanners);
  } catch (error) {
    console.error('Error fetching banner2s:', error.message);
    res.status(500).json({ message: 'Failed to fetch banner2s' });
  }
};

// Add a new banner2
export const addBanner2 = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Banner2 image is required' });
    }

    const { text } = req.body;

    const banner = new Banner2({
      image: {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      },
      text,
    });

    await banner.save();
    res.status(201).json({ message: 'Banner2 added successfully', banner });
  } catch (error) {
    console.error('Error adding banner2:', error.message);
    res.status(500).json({ message: 'Failed to add banner2' });
  }
};

// Delete a banner2
export const deleteBanner2 = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner2.findByIdAndDelete(id);

    if (!banner) {
      return res.status(404).json({ message: 'Banner2 not found' });
    }

    res.status(200).json({ message: 'Banner2 deleted successfully' });
  } catch (error) {
    console.error('Error deleting banner2:', error.message);
    res.status(500).json({ message: 'Failed to delete banner2' });
  }
};
