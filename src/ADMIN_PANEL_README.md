# Voice2Law Admin Panel

## Accessing the Admin Panel

The admin panel can be accessed in two ways:

### Method 1: Direct URL
Change the URL parameter to access admin directly:
- Navigate to the app and manually change `currentPage` state to `'admin'`

### Method 2: Via Sign In Page
1. Go to Sign In page
2. Look for "Admin Access" link at the bottom of the form
3. Click to access the admin panel

## Admin Panel Features

### 🎯 Dashboard (Main View)
- **Total Legal Queries**: Real-time statistics with trend indicators
- **Voice vs Text Usage**: Weekly comparison bar chart
- **Most Asked Legal Topics**: Pie chart visualization
- **AI Performance Trend**: Line chart showing confidence and accuracy over time
- **Key Metrics**: Progress bars for Urdu accuracy, AI confidence, satisfaction, uptime
- **Recent Activities**: Live activity feed with system events

### 📚 Legal Knowledge Base
- **Complete legal content management system**
- **Features**:
  - Search by category, section, or content
  - Filter by status (Approved, Pending, Review)
  - Full table view with Urdu and English summaries
  - Action buttons: Edit, Approve, Reject
  - Legal disclaimer panel
  - Statistics summary
- **Sample Data**: 6 entries covering Family, Property, Criminal, Business, Civil, and Labour Law

### 🤖 AI Response Review & Monitoring
- **AI performance tracking and quality control**
- **Features**:
  - Average AI confidence and Urdu NLP score metrics
  - Filter tabs: All, Approved, Flagged, Under Review
  - Confidence indicators with color coding:
    - Green (≥80%): High confidence
    - Orange (60-79%): Medium confidence
    - Red (<60%): Low confidence (auto-flagged)
  - Manual override actions: Approve, Reject, Request Review
  - Dual language query and response display
- **Low Confidence Alert**: Automatic flagging system for responses below 60%

### 🔄 Additional Sections (Placeholder)
- **Urdu Law Content Management**: Specialized Urdu content handling
- **Voice & NLP Monitoring**: Speech recognition analytics
- **User Queries & Feedback**: User interaction tracking
- **Analytics & Reports**: Comprehensive reporting system
- **System Settings**: Configuration management
- **Logs & Security**: Audit trails and security monitoring

## UI Components

### Sidebar
- **Collapsible design**: Click collapse button to minimize
- **Icon + Label**: Each menu item shows icon with English and Urdu labels
- **Active state**: Current section highlighted in white
- **Smooth transitions**: All animations follow Voice2Law design system

### Top Bar
- **Admin profile**: Shows logged-in admin details
- **System status**: Live indicator (green = online)
- **Role badge**: Displays "Super Admin" with security icon
- **Notifications**: Bell icon with unread count
- **Logout button**: Returns to main website homepage

### Layout
- **Responsive design**: Adapts to collapsed/expanded sidebar
- **Clean spacing**: Large margins, no clutter
- **Card-based**: Modular widget system
- **Professional charts**: Using Recharts library for visualizations

## Color Scheme
Consistent with Voice2Law branding:
- Primary Green: `#1FAA59`
- Dark Green: `#0B3D2E`
- Gold Accent: `#C5A253`
- White: `#FFFFFF`
- Background: Gradient from `#E8F5ED` to white

## Typography
- **English**: Default system font
- **Urdu**: Noto Nastaliq Urdu (applied with `.urdu-text` class)

## Charts & Visualizations
1. **Bar Chart**: Voice vs Text usage comparison
2. **Pie Chart**: Legal topics distribution
3. **Line Chart**: AI performance trends over time
4. **Progress Bars**: Key metrics indicators

## Security Features
- **Admin-only access**: Separate route from main website
- **Role-based badges**: Visual indication of admin permissions
- **Secure logout**: Clean session termination
- **Activity logging**: Recent system events tracking

## Navigation Flow
```
Main Website → Sign In Page → Admin Access Link → Admin Panel
                                                  ↓
                Admin Panel → Logout → Main Website Homepage
```

## Future Enhancements
The following sections are marked "Under Development" and can be expanded:
- Urdu Law Content Management
- Voice & NLP Monitoring detailed analytics
- User Queries & Feedback management system
- Analytics & Reports generation
- System Settings configuration panel
- Logs & Security comprehensive monitoring

## Technical Stack
- **React**: Component-based architecture
- **TypeScript**: Type-safe development
- **Recharts**: Professional chart library
- **Lucide React**: Icon system
- **Tailwind CSS**: Utility-first styling
- **Responsive Design**: Mobile and desktop optimized
