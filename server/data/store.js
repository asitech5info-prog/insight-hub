const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { connectToDatabase, mongoose } = require('../config/db');

const BlogModel = require('../models/Blog');
const ReviewModel = require('../models/Review');
const MessageModel = require('../models/Message');
const SettingModel = require('../models/Setting');
const CategoryModel = require('../models/Category');
const ActivityLogModel = require('../models/ActivityLog');

const DB_FILE = path.join(__dirname, 'db.json');

const INITIAL_DATA = {
  categories: [
    { id: 'all', name: 'All Insights', icon: '✨' },
    { id: 'ai-ml', name: 'AI & Machine Learning', icon: '🤖' },
    { id: 'web-dev', name: 'Web Development', icon: '💻' },
    { id: 'cybersecurity', name: 'Cybersecurity', icon: '🛡️' },
    { id: 'future-tech', name: 'Future Tech', icon: '⚡' },
    { id: 'cloud-devops', name: 'Cloud & DevOps', icon: '☁️' },
    { id: 'gadgets', name: 'Gadgets & Hardware', icon: '🔮' }
  ],
  blogs: [
    {
      id: 'blog-1',
      title: 'The Quantum Leap in Generative AI: From LLMs to Autonomous Agents',
      slug: 'quantum-leap-generative-ai-autonomous-agents',
      category: 'AI & Machine Learning',
      categoryId: 'ai-ml',
      excerpt: 'Explore how multi-agent architectures, reasoning loops, and multimodal transformers are revolutionizing autonomous intelligence in 2026.',
      content: `The landscape of Artificial Intelligence has shifted dramatically from single-turn conversational models to autonomous agentic systems. Today's AI models are no longer just predictive text engines; they are intelligent problem solvers capable of reasoning, reflection, tool usage, and continuous self-correction.

### Key Architectures Driving Autonomous Agents

1. **ReAct & Plan-and-Solve Loops**: Agents break complex multi-step goals into manageable sub-tasks, execute tools sequentially, and evaluate outcomes before proceeding.
2. **Context Compression & Long-Horizon Memory**: Utilizing hierarchical vector stores and active memory distillation to retain critical facts over days of operation.
3. **Multi-Agent Swarms**: Specialized agents (researchers, coders, verifiers) collaborating under an orchestrator to deliver enterprise-grade outcomes.

\`\`\`javascript
// Example: Conceptual Agent Execution Loop
async function runAgenticWorkflow(goal, tools) {
  let state = { goal, stepsCompleted: [], status: 'ACTIVE' };
  while (state.status === 'ACTIVE') {
    const plan = await planner.evaluate(state);
    const action = await toolExecutor.call(plan.nextAction);
    state = updateState(state, action);
    if (state.goalAchieved) break;
  }
  return state.finalOutput;
}
\`\`\`

### What This Means for Developers
Developers are transitioning from prompt engineering to agent orchestration. Creating robust guardrails, reliable sandboxes, and low-latency feedback loops is now the core competency of modern software engineering.

> "The future belongs not to those who write the most code, but to those who orchestrate the most effective intelligence workflows."`,
      author: {
        name: 'Alex Rivera',
        role: 'Lead AI Architect',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      },
      coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
      readTime: '6 min read',
      views: 1420,
      likes: 284,
      tags: ['AI', 'Agents', 'LLM', 'Future'],
      featured: true,
      createdAt: '2026-08-20T10:30:00.000Z',
      updatedAt: '2026-08-20T10:30:00.000Z'
    },
    {
      id: 'blog-2',
      title: 'Zero-Trust Architecture: Securing Modern Cloud Native Infrastructure',
      slug: 'zero-trust-securing-cloud-native-infrastructure',
      category: 'Cybersecurity',
      categoryId: 'cybersecurity',
      excerpt: 'A comprehensive deep dive into identity-first security, micro-segmentation, and automated threat neutralization in hybrid cloud environments.',
      content: `Modern cybersecurity has evolved past traditional perimeter defense models. In an era of distributed remote engineering and multi-cloud infrastructure, the perimeter is everywhere.

### Core Pillars of Zero-Trust

- **Strict Identity Verification**: Every user, microservice, and API request must be authenticated and authorized dynamically based on contextual risk.
- **Least Privilege Access**: Grant minimal access strictly when needed with just-in-time (JIT) credentials.
- **Continuous Monitoring & Telemetry**: Real-time behavioral anomaly detection using distributed eBPF probes.

### Practical Implementation Strategy
1. Enforce Mutual TLS (mTLS) across all service mesh communications.
2. Implement cryptographic workload identity using SPIFFE/SPIRE.
3. Automate vulnerability remediation with policy-as-code engines.`,
      author: {
        name: 'Elena Rostova',
        role: 'Cyber Defense Lead',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
      },
      coverImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&auto=format&fit=crop&q=80',
      readTime: '5 min read',
      views: 980,
      likes: 195,
      tags: ['Security', 'Cloud', 'ZeroTrust', 'DevSecOps'],
      featured: true,
      createdAt: '2026-08-21T14:15:00.000Z',
      updatedAt: '2026-08-21T14:15:00.000Z'
    },
    {
      id: 'blog-3',
      title: 'Building Blazing Fast Web Applications with Modern Micro-Frontends',
      slug: 'building-blazing-fast-micro-frontends',
      category: 'Web Development',
      categoryId: 'web-dev',
      excerpt: 'Discover the latest paradigms in modular web development, module federation, and sub-second paint times with edge rendering.',
      content: `Web performance directly correlates with user engagement, conversion rates, and developer productivity. Micro-frontend architectures allow independent teams to ship features continuously without sacrificing client performance.

### Architectural Highlights
- **Module Federation**: Dynamic remote loading of decoupled user interface components.
- **Islands Architecture**: Delivering static HTML by default with selective hydration of interactive components.
- **Edge Caching**: Instant Time to First Byte (TTFB) under 30ms globally.

\`\`\`css
/* Responsive glassmorphic layout utility */
.card-glass {
  background: rgba(13, 17, 23, 0.75);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(139, 92, 246, 0.2);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}
\`\`\``,
      author: {
        name: 'Marcus Vance',
        role: 'Principal Frontend Engineer',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
      },
      coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80',
      readTime: '4 min read',
      views: 1150,
      likes: 210,
      tags: ['WebDev', 'JavaScript', 'Frontend', 'Performance'],
      featured: false,
      createdAt: '2026-08-22T09:00:00.000Z',
      updatedAt: '2026-08-22T09:00:00.000Z'
    },
    {
      id: 'blog-4',
      title: 'Next-Gen Neural Hardware: Neuromorphic Chips & Quantum Photonics',
      slug: 'next-gen-neural-hardware-neuromorphic-chips',
      category: 'Future Tech',
      categoryId: 'future-tech',
      excerpt: 'How brain-inspired silicon and light-speed photonic compute are breaking past the Moore’s law thermal ceiling.',
      content: `As massive deep learning models demand exponential energy, conventional silicon architectures face severe thermal and physical limits. Neuromorphic processors and optical quantum circuits are stepping forward to enable ultra-low power continuous inference.

### Key Breakthroughs
- **Spiking Neural Networks (SNNs)**: Event-driven computation mimicking biological synapses.
- **Silicon Photonics Matrix Multipliers**: Performing tensor calculations using laser wavelengths at near zero latency.
- **Cryogenic Qubit Interconnects**: Enabling coherent high-bandwidth communication between quantum coprocessors.`,
      author: {
        name: 'Dr. Sarah Lin',
        role: 'Hardware & Quantum Researcher',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
      },
      coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
      readTime: '7 min read',
      views: 1890,
      likes: 340,
      tags: ['Quantum', 'Hardware', 'Neuromorphic', 'DeepTech'],
      featured: true,
      createdAt: '2026-08-23T11:45:00.000Z',
      updatedAt: '2026-08-23T11:45:00.000Z'
    },
    {
      id: 'blog-5',
      title: 'Kubernetes in 2026: Autonomous Clusters & AI-Driven Autoscaling',
      slug: 'kubernetes-autonomous-clusters-ai-autoscaling',
      category: 'Cloud & DevOps',
      categoryId: 'cloud-devops',
      excerpt: 'Mastering automated zero-downtime deployments, predictive node right-sizing, and self-healing cloud clusters.',
      content: `Operating Kubernetes at scale is now driven by predictive AI models that forecast traffic spikes 15 minutes before they hit, automatically provisioning spot instances and re-balancing workloads seamlessly.

### Operational Automation
- Predictive Horizontal Pod Autoscaling (HPA) using LSTM load forecasters.
- Automated canary rollouts with automated rollbacks on error rate thresholds exceeding 0.05%.
- eBPF kernel level security enforcement without proxy bottlenecks.`,
      author: {
        name: 'Jordan Cole',
        role: 'Site Reliability Architect',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
      },
      coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
      readTime: '5 min read',
      views: 820,
      likes: 160,
      tags: ['Cloud', 'Kubernetes', 'DevOps', 'Automation'],
      featured: false,
      createdAt: '2026-08-24T08:20:00.000Z',
      updatedAt: '2026-08-24T08:20:00.000Z'
    },
    {
      id: 'blog-6',
      title: 'The Evolution of Spatial Computing and Mixed Reality Wearables',
      slug: 'evolution-spatial-computing-mixed-reality',
      category: 'Gadgets & Hardware',
      categoryId: 'gadgets',
      excerpt: 'Exploring micro-OLED displays, spatial audio tracking, and natural gesture neural interfaces in the next wave of wearables.',
      content: `Display technology and optical wave-guides have reached eye-resolution fidelity. Spatial computers are unlocking seamless workspace extensions, tactile holographic interaction, and collaborative remote presence.

### Technological Drivers
- 4K Micro-OLED pancake lenses with 120Hz refresh rate.
- Sub-millimeter hand and eye tracking with on-device low-power neural accelerators.
- Spatial sound propagation using real-time room impulse response modeling.`,
      author: {
        name: 'Alex Rivera',
        role: 'Lead AI Architect',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      },
      coverImage: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=1200&auto=format&fit=crop&q=80',
      readTime: '5 min read',
      views: 740,
      likes: 145,
      tags: ['SpatialComputing', 'AR', 'VR', 'Hardware'],
      featured: false,
      createdAt: '2026-08-24T16:00:00.000Z',
      updatedAt: '2026-08-24T16:00:00.000Z'
    }
  ],
  reviews: [
    {
      id: 'rev-1',
      blogId: 'blog-1',
      userName: 'Devon Miles',
      userEmail: 'devon.miles@techfrontier.io',
      rating: 5,
      comment: 'Incredible breakdown of agentic workflows! The loop diagram and practical breakdown of multi-agent swarms clarified many concepts for our engineering team.',
      createdAt: '2026-08-21T11:20:00.000Z',
      adminReply: 'Thanks Devon! Glad this helped your team. We will be releasing a full reference implementation tutorial in our next article!',
      replyDate: '2026-08-21T13:40:00.000Z'
    },
    {
      id: 'rev-2',
      blogId: 'blog-1',
      userName: 'Sophia Chen',
      userEmail: 'sophia@cloudmesh.com',
      rating: 5,
      comment: 'The focus on context compression and memory distillation is spot-on. Essential reading for modern AI developers.',
      createdAt: '2026-08-22T08:15:00.000Z',
      adminReply: null,
      replyDate: null
    },
    {
      id: 'rev-3',
      blogId: 'blog-2',
      userName: 'Carlos Gomez',
      userEmail: 'cgomez@cyberguard.net',
      rating: 5,
      comment: 'Clean and practical guide on Zero-Trust. The mTLS and SPIFFE workload identity section is very well articulated.',
      createdAt: '2026-08-22T15:30:00.000Z',
      adminReply: 'Thank you Carlos! Zero-Trust security is indeed paramount in modern distributed systems.',
      replyDate: '2026-08-22T17:00:00.000Z'
    }
  ],
  messages: [
    {
      id: 'msg-1',
      name: 'James Walker',
      email: 'james.w@innovatetech.com',
      subject: 'Collaboration on Quantum AI research article',
      message: 'Hello Insight Hub Team, I really enjoy your articles on AI architectures. Would love to contribute a guest piece on Quantum Neural Networks.',
      createdAt: '2026-08-24T12:00:00.000Z',
      read: false
    },
    {
      id: 'msg-2',
      name: 'Amina Zahra',
      email: 'amina@venturecloud.org',
      subject: 'Inquiry about speaking at Future Tech Summit 2026',
      message: 'Hi! We would love to invite the Insight Hub authors to give a keynote at our upcoming tech conference next month.',
      createdAt: '2026-08-25T09:30:00.000Z',
      read: true
    }
  ],
  settings: {
    siteName: 'Insight Hub',
    tagline: 'Explore · Learn · Innovate · Shape the Future',
    contactEmail: 'asitech5info@gmail.com',
    youtubeUrl: 'https://www.youtube.com/@howtech_works',
    announcementBanner: '🚀 Welcome to Insight Hub — The Future of Tech & AI Insights',
    showBanner: true,
    accentTheme: 'green-yellow',
    featuredBadge: 'Editor Choice 2026'
  },
  activityLogs: [
    { id: 'log-1', action: 'System Boot', detail: 'Insight Hub Command Center online', timestamp: new Date().toISOString() }
  ]
};

// In-memory / JSON file fallback
let inMemoryData = null;

function ensureLocalDb() {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf8');
    }
  } catch (e) {
    // In read-only serverless environment (e.g. Vercel tmp fallback), use inMemoryData
    if (!inMemoryData) {
      inMemoryData = JSON.parse(JSON.stringify(INITIAL_DATA));
    }
  }
}

function readLocalDb() {
  if (inMemoryData) return inMemoryData;
  ensureLocalDb();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const data = JSON.parse(raw);
    if (!data.settings) data.settings = INITIAL_DATA.settings;
    if (!data.activityLogs) data.activityLogs = INITIAL_DATA.activityLogs;
    return data;
  } catch (err) {
    if (!inMemoryData) inMemoryData = JSON.parse(JSON.stringify(INITIAL_DATA));
    return inMemoryData;
  }
}

function writeLocalDb(data) {
  if (inMemoryData) {
    inMemoryData = data;
    return;
  }
  try {
    ensureLocalDb();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    inMemoryData = data;
  }
}

function generateId(prefix = 'item') {
  return `${prefix}-${crypto.randomBytes(4).toString('hex')}`;
}

let hasSeededMongo = false;

async function checkAndSeedMongo() {
  if (hasSeededMongo) return;
  try {
    const blogCount = await BlogModel.countDocuments();
    if (blogCount === 0) {
      console.log('🌱 Empty MongoDB database detected. Seeding Initial Data into Cluster...');
      await BlogModel.insertMany(INITIAL_DATA.blogs);
      await ReviewModel.insertMany(INITIAL_DATA.reviews);
      await MessageModel.insertMany(INITIAL_DATA.messages);
      await CategoryModel.insertMany(INITIAL_DATA.categories);
      await ActivityLogModel.insertMany(INITIAL_DATA.activityLogs);
      await SettingModel.findOneAndUpdate(
        { key: 'site_config' },
        { ...INITIAL_DATA.settings, key: 'site_config' },
        { upsert: true, new: true }
      );
      console.log('✅ MongoDB Cluster seeded successfully with default articles & settings.');
    }
    hasSeededMongo = true;
  } catch (err) {
    console.error('Mongo Seed Check Error:', err.message);
  }
}

// ----------------------------------------------------
// UNIFIED ASYNC DATA ADAPTER API
// ----------------------------------------------------
const dbAdapter = {
  // DB status
  async getStatus() {
    const conn = await connectToDatabase();
    return {
      connected: conn.isConnected,
      mode: conn.mode,
      database: conn.isConnected ? 'MongoDB Atlas Cluster' : 'Local JSON / In-Memory Store'
    };
  },

  // BLOGS
  async getBlogs(query = {}) {
    const conn = await connectToDatabase();
    if (conn.isConnected) {
      await checkAndSeedMongo();
      let filter = {};
      if (query.category && query.category !== 'all') {
        filter.$or = [
          { categoryId: { $regex: new RegExp(`^${query.category}$`, 'i') } },
          { category: { $regex: new RegExp(query.category, 'i') } }
        ];
      }
      if (query.featured === 'true') {
        filter.featured = true;
      }
      if (query.search) {
        const q = query.search.trim();
        filter.$or = [
          { title: { $regex: q, $options: 'i' } },
          { excerpt: { $regex: q, $options: 'i' } },
          { category: { $regex: q, $options: 'i' } },
          { tags: { $regex: q, $options: 'i' } }
        ];
      }

      let sortOpt = { createdAt: -1 };
      if (query.sort === 'popular') {
        sortOpt = { views: -1, likes: -1 };
      }

      const blogs = await BlogModel.find(filter).sort(sortOpt).lean();
      const reviews = await ReviewModel.find().lean();
      const categories = await CategoryModel.find().lean();

      const enrichedBlogs = blogs.map(b => {
        const blogReviews = reviews.filter(r => r.blogId === b.id);
        const reviewCount = blogReviews.length;
        const avgRating = reviewCount > 0
          ? (blogReviews.reduce((sum, r) => sum + Number(r.rating || 5), 0) / reviewCount).toFixed(1)
          : '5.0';
        return { ...b, reviewCount, avgRating: parseFloat(avgRating) };
      });

      if (query.sort === 'rating') {
        enrichedBlogs.sort((a, b) => b.avgRating - a.avgRating);
      }

      return {
        blogs: enrichedBlogs,
        total: enrichedBlogs.length,
        categories: categories.length > 0 ? categories : INITIAL_DATA.categories
      };
    }

    // Local fallback
    const db = readLocalDb();
    let blogs = db.blogs.map(b => {
      const blogReviews = db.reviews.filter(r => r.blogId === b.id);
      const reviewCount = blogReviews.length;
      const avgRating = reviewCount > 0
        ? (blogReviews.reduce((sum, r) => sum + Number(r.rating || 5), 0) / reviewCount).toFixed(1)
        : '5.0';
      return { ...b, reviewCount, avgRating: parseFloat(avgRating) };
    });

    if (query.category && query.category !== 'all') {
      blogs = blogs.filter(b =>
        (b.categoryId && b.categoryId.toLowerCase() === query.category.toLowerCase()) ||
        (b.category && b.category.toLowerCase().includes(query.category.toLowerCase()))
      );
    }

    if (query.search) {
      const q = query.search.toLowerCase().trim();
      blogs = blogs.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.excerpt.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        (b.tags && b.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    if (query.featured === 'true') {
      blogs = blogs.filter(b => b.featured);
    }

    if (query.sort === 'popular') {
      blogs.sort((a, b) => (b.views + b.likes) - (a.views + a.likes));
    } else if (query.sort === 'rating') {
      blogs.sort((a, b) => b.avgRating - a.avgRating);
    } else {
      blogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return {
      blogs,
      total: blogs.length,
      categories: db.categories || INITIAL_DATA.categories
    };
  },

  async getBlogByIdOrSlug(idOrSlug) {
    const conn = await connectToDatabase();
    if (conn.isConnected) {
      await checkAndSeedMongo();
      const blog = await BlogModel.findOne({
        $or: [{ id: idOrSlug }, { slug: idOrSlug }]
      });
      if (!blog) return null;

      blog.views = (blog.views || 0) + 1;
      await blog.save();

      const reviews = await ReviewModel.find({ blogId: blog.id }).sort({ createdAt: -1 }).lean();
      const allBlogReviews = reviews;
      const reviewCount = allBlogReviews.length;
      const avgRating = reviewCount > 0
        ? (allBlogReviews.reduce((sum, r) => sum + Number(r.rating || 5), 0) / reviewCount).toFixed(1)
        : '5.0';

      const enriched = {
        ...blog.toObject(),
        reviewCount,
        avgRating: parseFloat(avgRating)
      };

      return { blog: enriched, reviews };
    }

    // Local fallback
    const db = readLocalDb();
    const blog = db.blogs.find(b => b.id === idOrSlug || b.slug === idOrSlug);
    if (!blog) return null;

    blog.views = (blog.views || 0) + 1;
    writeLocalDb(db);

    const reviews = db.reviews
      .filter(r => r.blogId === blog.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const blogReviews = db.reviews.filter(r => r.blogId === blog.id);
    const reviewCount = blogReviews.length;
    const avgRating = reviewCount > 0
      ? (blogReviews.reduce((sum, r) => sum + Number(r.rating || 5), 0) / reviewCount).toFixed(1)
      : '5.0';

    return {
      blog: { ...blog, reviewCount, avgRating: parseFloat(avgRating) },
      reviews
    };
  },

  async likeBlog(id) {
    const conn = await connectToDatabase();
    if (conn.isConnected) {
      const blog = await BlogModel.findOne({ id });
      if (!blog) return null;
      blog.likes = (blog.likes || 0) + 1;
      await blog.save();
      return blog.likes;
    }

    const db = readLocalDb();
    const blog = db.blogs.find(b => b.id === id);
    if (!blog) return null;
    blog.likes = (blog.likes || 0) + 1;
    writeLocalDb(db);
    return blog.likes;
  },

  async createBlog(data) {
    const conn = await connectToDatabase();
    const newBlog = {
      id: generateId('blog'),
      ...data,
      views: 0,
      likes: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (conn.isConnected) {
      const created = await BlogModel.create(newBlog);
      await ActivityLogModel.create({
        id: generateId('log'),
        action: 'Article Created',
        detail: `Created "${newBlog.title}"`,
        timestamp: new Date().toISOString()
      });
      return created.toObject();
    }

    const db = readLocalDb();
    db.blogs.unshift(newBlog);
    if (!db.activityLogs) db.activityLogs = [];
    db.activityLogs.unshift({
      id: generateId('log'),
      action: 'Article Created',
      detail: `Created "${newBlog.title}"`,
      timestamp: new Date().toISOString()
    });
    writeLocalDb(db);
    return newBlog;
  },

  async updateBlog(id, data) {
    const conn = await connectToDatabase();
    if (conn.isConnected) {
      const updated = await BlogModel.findOneAndUpdate(
        { id },
        { ...data, updatedAt: new Date().toISOString() },
        { new: true }
      );
      return updated ? updated.toObject() : null;
    }

    const db = readLocalDb();
    const index = db.blogs.findIndex(b => b.id === id);
    if (index === -1) return null;
    db.blogs[index] = {
      ...db.blogs[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    writeLocalDb(db);
    return db.blogs[index];
  },

  async deleteBlog(id) {
    const conn = await connectToDatabase();
    if (conn.isConnected) {
      const deleted = await BlogModel.findOneAndDelete({ id });
      if (!deleted) return false;
      await ReviewModel.deleteMany({ blogId: id });
      return true;
    }

    const db = readLocalDb();
    const initLen = db.blogs.length;
    db.blogs = db.blogs.filter(b => b.id !== id);
    if (db.blogs.length === initLen) return false;
    db.reviews = db.reviews.filter(r => r.blogId !== id);
    writeLocalDb(db);
    return true;
  },

  // REVIEWS
  async createReview(data) {
    const conn = await connectToDatabase();
    const newRev = {
      id: generateId('rev'),
      ...data,
      createdAt: new Date().toISOString(),
      adminReply: null,
      replyDate: null
    };

    if (conn.isConnected) {
      const created = await ReviewModel.create(newRev);
      return created.toObject();
    }

    const db = readLocalDb();
    db.reviews.unshift(newRev);
    writeLocalDb(db);
    return newRev;
  },

  async getAllReviews() {
    const conn = await connectToDatabase();
    if (conn.isConnected) {
      const reviews = await ReviewModel.find().sort({ createdAt: -1 }).lean();
      const blogs = await BlogModel.find().lean();
      return reviews.map(r => {
        const b = blogs.find(bg => bg.id === r.blogId);
        return { ...r, blogTitle: b ? b.title : 'Deleted Blog Post' };
      });
    }

    const db = readLocalDb();
    return db.reviews.map(r => {
      const blog = db.blogs.find(b => b.id === r.blogId);
      return { ...r, blogTitle: blog ? blog.title : 'Deleted Blog Post' };
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async replyReview(id, reply) {
    const replyDate = reply ? new Date().toISOString() : null;
    const conn = await connectToDatabase();
    if (conn.isConnected) {
      const updated = await ReviewModel.findOneAndUpdate(
        { id },
        { adminReply: reply ? reply.trim() : null, replyDate },
        { new: true }
      );
      return updated ? updated.toObject() : null;
    }

    const db = readLocalDb();
    const rev = db.reviews.find(r => r.id === id);
    if (!rev) return null;
    rev.adminReply = reply ? reply.trim() : null;
    rev.replyDate = replyDate;
    writeLocalDb(db);
    return rev;
  },

  async deleteReview(id) {
    const conn = await connectToDatabase();
    if (conn.isConnected) {
      const res = await ReviewModel.findOneAndDelete({ id });
      return Boolean(res);
    }

    const db = readLocalDb();
    const initLen = db.reviews.length;
    db.reviews = db.reviews.filter(r => r.id !== id);
    if (db.reviews.length === initLen) return false;
    writeLocalDb(db);
    return true;
  },

  // MESSAGES
  async createMessage(data) {
    const conn = await connectToDatabase();
    const newMsg = {
      id: generateId('msg'),
      ...data,
      createdAt: new Date().toISOString(),
      read: false
    };

    if (conn.isConnected) {
      const created = await MessageModel.create(newMsg);
      return created.toObject();
    }

    const db = readLocalDb();
    db.messages.unshift(newMsg);
    writeLocalDb(db);
    return newMsg;
  },

  async getAllMessages() {
    const conn = await connectToDatabase();
    if (conn.isConnected) {
      return await MessageModel.find().sort({ createdAt: -1 }).lean();
    }

    const db = readLocalDb();
    return [...db.messages].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async toggleMessageRead(id, readVal) {
    const conn = await connectToDatabase();
    if (conn.isConnected) {
      const updated = await MessageModel.findOneAndUpdate(
        { id },
        { read: readVal !== undefined ? Boolean(readVal) : true },
        { new: true }
      );
      return updated ? updated.toObject() : null;
    }

    const db = readLocalDb();
    const msg = db.messages.find(m => m.id === id);
    if (!msg) return null;
    msg.read = readVal !== undefined ? Boolean(readVal) : true;
    writeLocalDb(db);
    return msg;
  },

  async deleteMessage(id) {
    const conn = await connectToDatabase();
    if (conn.isConnected) {
      const res = await MessageModel.findOneAndDelete({ id });
      return Boolean(res);
    }

    const db = readLocalDb();
    const initLen = db.messages.length;
    db.messages = db.messages.filter(m => m.id !== id);
    if (db.messages.length === initLen) return false;
    writeLocalDb(db);
    return true;
  },

  // SETTINGS
  async getSettings() {
    const conn = await connectToDatabase();
    if (conn.isConnected) {
      await checkAndSeedMongo();
      let setting = await SettingModel.findOne({ key: 'site_config' }).lean();
      if (!setting) {
        setting = await SettingModel.create({ ...INITIAL_DATA.settings, key: 'site_config' });
      }
      return setting;
    }

    const db = readLocalDb();
    return db.settings || INITIAL_DATA.settings;
  },

  async updateSettings(data) {
    const conn = await connectToDatabase();
    if (conn.isConnected) {
      const updated = await SettingModel.findOneAndUpdate(
        { key: 'site_config' },
        { $set: data },
        { upsert: true, new: true }
      );
      return updated.toObject();
    }

    const db = readLocalDb();
    db.settings = { ...db.settings, ...data };
    writeLocalDb(db);
    return db.settings;
  },

  // STATS
  async getStats() {
    const conn = await connectToDatabase();
    if (conn.isConnected) {
      await checkAndSeedMongo();
      const blogs = await BlogModel.find().lean();
      const reviews = await ReviewModel.find().lean();
      const messages = await MessageModel.find().lean();
      const settings = await this.getSettings();

      const totalBlogs = blogs.length;
      const totalReviews = reviews.length;
      const totalMessages = messages.length;
      const unreadMessages = messages.filter(m => !m.read).length;
      const totalViews = blogs.reduce((sum, b) => sum + (b.views || 0), 0);
      const totalLikes = blogs.reduce((sum, b) => sum + (b.likes || 0), 0);
      const featuredCount = blogs.filter(b => b.featured).length;

      const categoryCounts = {};
      blogs.forEach(b => {
        categoryCounts[b.category] = (categoryCounts[b.category] || 0) + 1;
      });

      const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      reviews.forEach(r => {
        const rate = Math.round(Number(r.rating) || 5);
        if (ratingDistribution[rate] !== undefined) ratingDistribution[rate]++;
      });

      const avgRating = totalReviews > 0
        ? (reviews.reduce((sum, r) => sum + Number(r.rating || 5), 0) / totalReviews).toFixed(1)
        : '5.0';

      return {
        totalBlogs,
        totalReviews,
        totalMessages,
        unreadMessages,
        totalViews,
        totalLikes,
        featuredCount,
        avgRating: parseFloat(avgRating),
        categoryCounts,
        ratingDistribution,
        settings
      };
    }

    const db = readLocalDb();
    const totalBlogs = db.blogs.length;
    const totalReviews = db.reviews.length;
    const totalMessages = db.messages.length;
    const unreadMessages = db.messages.filter(m => !m.read).length;
    const totalViews = db.blogs.reduce((sum, b) => sum + (b.views || 0), 0);
    const totalLikes = db.blogs.reduce((sum, b) => sum + (b.likes || 0), 0);
    const featuredCount = db.blogs.filter(b => b.featured).length;

    const categoryCounts = {};
    db.blogs.forEach(b => {
      categoryCounts[b.category] = (categoryCounts[b.category] || 0) + 1;
    });

    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    db.reviews.forEach(r => {
      const rate = Math.round(Number(r.rating) || 5);
      if (ratingDistribution[rate] !== undefined) ratingDistribution[rate]++;
    });

    const avgRating = totalReviews > 0
      ? (db.reviews.reduce((sum, r) => sum + Number(r.rating || 5), 0) / totalReviews).toFixed(1)
      : '5.0';

    return {
      totalBlogs,
      totalReviews,
      totalMessages,
      unreadMessages,
      totalViews,
      totalLikes,
      featuredCount,
      avgRating: parseFloat(avgRating),
      categoryCounts,
      ratingDistribution,
      settings: db.settings
    };
  },

  // EXPORT ALL DATA
  async exportAllData() {
    const conn = await connectToDatabase();
    if (conn.isConnected) {
      const blogs = await BlogModel.find().lean();
      const reviews = await ReviewModel.find().lean();
      const messages = await MessageModel.find().lean();
      const categories = await CategoryModel.find().lean();
      const settings = await this.getSettings();
      const activityLogs = await ActivityLogModel.find().lean();

      return {
        categories: categories.length > 0 ? categories : INITIAL_DATA.categories,
        blogs,
        reviews,
        messages,
        settings,
        activityLogs
      };
    }

    return readLocalDb();
  }
};

module.exports = {
  dbAdapter,
  readDb: readLocalDb,
  writeDb: writeLocalDb,
  generateId,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'vape1098'
};
