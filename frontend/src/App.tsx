import { Route, Routes } from "react-router-dom";
import AdminLayout from "./admin/AdminLayout";
import AdminCollections from "./admin/Collections";
import Dashboard from "./admin/Dashboard";
import DesignForm from "./admin/DesignForm";
import AdminDesigns from "./admin/Designs";
import Inquiries from "./admin/Inquiries";
import Login from "./admin/Login";
import Settings from "./admin/Settings";
import { VideoForm, VideosList } from "./admin/Videos";
import Layout from "./components/Layout";
import { Empty } from "./components/ui";
import About from "./pages/About";
import Collections from "./pages/Collections";
import Contact from "./pages/Contact";
import DesignDetail from "./pages/DesignDetail";
import Home from "./pages/Home";
import Videos from "./pages/Videos";
import { Link } from "react-router-dom";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="collections" element={<Collections />} />
        <Route path="collections/:id" element={<DesignDetail />} />
        <Route path="videos" element={<Videos />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="*" element={<div className="pt-32"><Empty title="Page not found" action={<Link to="/" className="btn btn-dark">Back home</Link>} /></div>} />
      </Route>
      <Route path="admin/login" element={<Login />} />
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="designs" element={<AdminDesigns />} />
        <Route path="designs/new" element={<DesignForm />} />
        <Route path="designs/:id" element={<DesignForm />} />
        <Route path="collections" element={<AdminCollections />} />
        <Route path="videos" element={<VideosList />} />
        <Route path="videos/new" element={<VideoForm />} />
        <Route path="videos/:id" element={<VideoForm />} />
        <Route path="inquiries" element={<Inquiries />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
