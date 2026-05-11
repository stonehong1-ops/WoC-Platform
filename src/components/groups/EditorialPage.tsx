import React, { useState } from 'react';

const MOCK_CATEGORIES = ['All', 'Announcements', 'Thought Leadership', 'Case Studies', 'Product Updates'];
const MOCK_ARTICLES = [
  { id: 1, title: 'The Future of Community-Led Growth in 2024', category: 'Thought Leadership', author: 'Sarah Jenkins', date: 'Oct 24, 2023', readTime: '5 min read', image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop', excerpt: 'Discover how community-led growth is reshaping the landscape of modern businesses and why building a loyal user base is more important than ever.', featured: true },
  { id: 2, title: 'Case Study: How TechFlow Increased Engagement by 300%', category: 'Case Studies', author: 'Marcus Cole', date: 'Oct 20, 2023', readTime: '8 min read', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop', excerpt: 'An in-depth look at the strategies TechFlow used to revitalize their community platform.', featured: false },
  { id: 3, title: 'Introducing the New Brand Media Modules', category: 'Product Updates', author: 'Product Team', date: 'Oct 18, 2023', readTime: '3 min read', image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=400&fit=crop', excerpt: 'We are thrilled to announce the rollout of our new Media Gallery, Video Library, and Editorial features.', featured: false },
  { id: 4, title: 'Welcome to Our New Advisory Board Members', category: 'Announcements', author: 'Admin', date: 'Oct 15, 2023', readTime: '4 min read', image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&h=400&fit=crop', excerpt: 'Meet the industry experts joining our advisory board this quarter.', featured: false },
  { id: 5, title: '10 Tips for Managing Remote Teams Effectively', category: 'Thought Leadership', author: 'Elena Rodriguez', date: 'Oct 10, 2023', readTime: '6 min read', image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop', excerpt: 'Practical advice for keeping remote and distributed teams aligned, motivated, and productive.', featured: false },
];

export default function EditorialPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  
  const featuredArticle = MOCK_ARTICLES.find(a => a.featured) || MOCK_ARTICLES[0];
  const regularArticles = activeCategory === 'All' 
    ? MOCK_ARTICLES.filter(a => !a.featured)
    : MOCK_ARTICLES.filter(a => a.category === activeCategory && !a.featured);

  return (
    <div className="flex flex-col h-full bg-surface overflow-y-auto">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 bg-surface/80 backdrop-blur-md z-10">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">Editorial</h2>
          <p className="text-sm text-on-surface-variant mt-1">Publish and manage articles, stories, and news.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined">analytics</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm">
            <span className="material-symbols-outlined text-sm">edit_document</span>
            New Article
          </button>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-10">
        
        {/* Featured Hero Article */}
        {activeCategory === 'All' && (
          <div className="relative rounded-3xl overflow-hidden bg-surface-variant border border-outline-variant/20 shadow-md group cursor-pointer">
            <div className="absolute inset-0">
              <img src={featuredArticle.image} alt={featuredArticle.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            </div>
            <div className="relative p-6 md:p-10 flex flex-col justify-end min-h-[400px] h-[50vh] max-h-[500px]">
              <div className="mb-4 flex items-center gap-3">
                <span className="px-3 py-1 bg-primary text-on-primary text-xs font-bold rounded-full uppercase tracking-wider">
                  Featured
                </span>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-medium rounded-full">
                  {featuredArticle.category}
                </span>
              </div>
              <h3 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight group-hover:text-primary-container transition-colors">
                {featuredArticle.title}
              </h3>
              <p className="text-white/80 md:text-lg mb-6 max-w-3xl line-clamp-2 md:line-clamp-3">
                {featuredArticle.excerpt}
              </p>
              <div className="flex items-center gap-4 text-white/60 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <span className="material-symbols-outlined text-[16px] text-white">person</span>
                  </div>
                  <span className="font-medium text-white">{featuredArticle.author}</span>
                </div>
                <span>•</span>
                <span>{featuredArticle.date}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  {featuredArticle.readTime}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Categories Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          {MOCK_CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === category
                  ? 'bg-on-surface text-surface'
                  : 'bg-surface-variant/50 text-on-surface-variant hover:bg-surface-variant'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Articles List/Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {regularArticles.map(article => (
            <div key={article.id} className="group cursor-pointer flex flex-col h-full">
              <div className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-5 bg-surface-variant border border-outline-variant/20 shadow-sm">
                <img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-surface/90 backdrop-blur-sm text-on-surface text-[10px] font-bold rounded uppercase tracking-wider shadow-sm">
                  {article.category}
                </div>
              </div>
              
              <div className="flex flex-col flex-1">
                <h4 className="text-xl font-bold text-on-surface mb-3 leading-snug group-hover:text-primary transition-colors line-clamp-2">
                  {article.title}
                </h4>
                <p className="text-on-surface-variant text-sm mb-5 line-clamp-3">
                  {article.excerpt}
                </p>
                
                <div className="mt-auto pt-4 border-t border-outline-variant/30 flex items-center justify-between text-xs text-on-surface-variant">
                  <span className="font-medium text-on-surface">{article.author}</span>
                  <div className="flex items-center gap-2">
                    <span>{article.date}</span>
                    <span>•</span>
                    <span>{article.readTime}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {regularArticles.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-surface-variant rounded-full flex items-center justify-center mx-auto mb-4 text-on-surface-variant">
              <span className="material-symbols-outlined text-3xl">article</span>
            </div>
            <h3 className="text-lg font-medium text-on-surface mb-1">No articles found</h3>
            <p className="text-on-surface-variant text-sm">There are no published articles in this category yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
