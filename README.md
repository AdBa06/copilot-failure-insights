# 🔍 EntraLens - Copilot Failure Insights Dashboard

A comprehensive analytics dashboard for analyzing Microsoft Entra Copilot failures and performance insights.

## 🚀 Live Demo

**[View Live Dashboard](https://your-username.github.io/copilot-failure-insights/)**

## ✨ Features

### 📊 **Deep Analytics**
- **Performance Heatmap**: Skill failure patterns by time of day
- **User Journey Funnel**: Identify where users drop off in the Copilot process
- **Impact vs Frequency Matrix**: Prioritize issues by severity and frequency
- **Detection vs Resolution Time**: Operational efficiency metrics

### 🔧 **Reliability Insights**
- **Skill Reliability Scorecard**: Rankings and SLA status
- **Tenant Health Overview**: Multi-tenant performance monitoring
- **Real-time Filtering**: Dynamic cluster analysis
- **Smart Settings**: Configurable thresholds and auto-refresh

### 📈 **Export Capabilities**
- **Excel Export**: Multi-sheet workbooks with detailed analytics
- **PDF Reports**: Executive summaries and dashboards
- **CSV Data**: Raw data for further analysis

### 🎛️ **Interactive Controls**
- **Advanced Filtering**: Severity, root cause, status, and failure count ranges
- **Dynamic Settings**: Cluster thresholds, auto-refresh intervals
- **Responsive Design**: Works on desktop, tablet, and mobile

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript
- **UI Components**: shadcn/ui + Radix UI
- **Charts**: Recharts
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Deployment**: GitHub Pages

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/copilot-failure-insights.git
   cd copilot-failure-insights
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:8080
   ```

### Production Build

```bash
npm run build
npm run preview
```

## 📦 Deployment

### GitHub Pages (Automatic)
- Push to `main` branch
- GitHub Actions automatically builds and deploys
- Live at: `https://your-username.github.io/copilot-failure-insights/`

### Manual Deployment
```bash
npm run deploy
```

## 🎯 Use Cases

### **For DevOps Teams**
- Monitor Copilot reliability and performance
- Identify recurring failure patterns
- Track resolution times and operational metrics

### **For Product Teams**
- Understand user journey failure points
- Prioritize feature improvements
- Analyze tenant-specific issues

### **For Management**
- Executive dashboards and reports
- SLA compliance monitoring
- Strategic decision support

## 🔮 Future Enhancements

- **Real-time Data**: Integration with Azure Application Insights
- **KQL Queries**: Dynamic Kusto query support
- **Alerting**: Proactive failure notifications
- **Machine Learning**: Automated root cause analysis

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/) components
- Charts powered by [Recharts](https://recharts.org/)
- Icons from [Lucide React](https://lucide.dev/)

---

**Made with ❤️ for better Copilot insights**
