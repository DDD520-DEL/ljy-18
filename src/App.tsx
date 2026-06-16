import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Records from "@/pages/Records";
import RecordForm from "@/pages/RecordForm";
import Contacts from "@/pages/Contacts";
import ContactDetail from "@/pages/ContactDetail";
import Statistics from "@/pages/Statistics";
import Settings from "@/pages/Settings";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/records" element={<Records />} />
          <Route path="/records/add" element={<RecordForm />} />
          <Route path="/records/:id/edit" element={<RecordForm />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/contacts/:name" element={<ContactDetail />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}
