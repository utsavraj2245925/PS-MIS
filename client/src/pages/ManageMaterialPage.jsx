import { useEffect, useState } from "react";
import {
  Table,
  Modal,
  Form,
  Input,
  Select,
  Button,
  message,
  Popconfirm,
  Tag,
} from "antd";
import {
  FlaskConical,
  Package,
  Boxes,
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import axiosInstance from "../api/axiosInstance"; // adjust path to your project structure

// ---------------------------------------------------------------
// Section config: drives color, icon, label, and which `type`
// value is sent to the shared /api/materials endpoint
// ---------------------------------------------------------------
const SECTION_CONFIG = {
  powderItems: {
    key: "powderItems",
    title: "Powder Items",
    subtitle: "Manage powder material stock items",
    color: { base: "#7c3aed", light: "#ede9fe", from: "#7c3aed", to: "#6d28d9" },
    icon: Boxes,
  },
  chemicalItems: {
    key: "chemicalItems",
    title: "Chemical Items",
    subtitle: "Manage chemical material stock items",
    color: { base: "#0d9488", light: "#ccfbf1", from: "#0d9488", to: "#0f766e" },
    icon: FlaskConical,
  },
  usefulItems: {
    key: "usefulItems",
    title: "Useful Items",
    subtitle: "Manage general/useful stock items",
    color: { base: "#2563eb", light: "#dbeafe", from: "#2563eb", to: "#1d4ed8" },
    icon: Package,
  },
};

const MEASUREMENT_OPTIONS = [
  { value: "kg", label: "kg" },
  { value: "ltr", label: "ltr" },
  { value: "pcs", label: "pcs" },
];

const S = {
  page: "min-h-screen bg-slate-50 p-5",
  card: "bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition",
  modalHeaderGradient: (from, to) => ({
    background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
    margin: "-20px -24px 20px -24px",
    padding: "20px 24px",
    borderRadius: "12px 12px 0 0",
    color: "#fff",
  }),
};

// ---------------------------------------------------------------
// Material manager: lists & lets you Add/Edit/Delete materials
// of a fixed `type`. Backed by /api/materials?type=<key>
// ---------------------------------------------------------------
function MaterialManager({ config, onBack }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  const Icon = config.icon;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/materials", {
        params: { type: config.key },
      });
      setData(res.data?.data || []);
    } catch (err) {
      message.error(`Failed to load ${config.title.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.key]);

  const openAddModal = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ mesurmentType: "kg" });
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      name: record.name,
      mesurmentType: record.mesurmentType,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingRecord) {
        await axiosInstance.put(`/materials/${editingRecord._id}`, values);
        message.success(`${config.title.slice(0, -1)} updated`);
      } else {
        await axiosInstance.post("/materials", { ...values, type: config.key });
        message.success(`${config.title.slice(0, -1)} added`);
      }

      setModalOpen(false);
      form.resetFields();
      fetchData();
    } catch (err) {
      if (err?.errorFields) return; // antd validation error
      message.error(err?.response?.data?.message || "Something went wrong");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/materials/${id}`);
      message.success("Material deleted");
      fetchData();
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to delete material");
    }
  };

  const columns = [
    {
      title: "#",
      key: "index",
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Material Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Measurement Unit",
      dataIndex: "mesurmentType",
      key: "mesurmentType",
      render: (val) => <Tag color={config.color.base}>{val}</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      align: "center",
      render: (_, record) => (
        <div className="flex items-center justify-center gap-2">
          <Button size="small" icon={<Pencil size={14} />} onClick={() => openEditModal(record)} />
          <Popconfirm
            title="Delete this material?"
            description="This action cannot be undone."
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record._id)}
          >
            <Button size="small" danger icon={<Trash2 size={14} />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button type="text" icon={<ArrowLeft size={18} />} onClick={onBack} />
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: config.color.light }}
          >
            <Icon size={24} style={{ color: config.color.base }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{config.title}</h1>
            <p className="text-sm text-slate-500">{config.subtitle}</p>
          </div>
        </div>

        <Button
          type="primary"
          icon={<Plus size={16} />}
          style={{ backgroundColor: config.color.base, borderColor: config.color.base }}
          onClick={openAddModal}
        >
          Add Material
        </Button>
      </div>

      {/* TABLE */}
      <div className={S.card}>
        <Table
          rowKey="_id"
          loading={loading}
          dataSource={data}
          columns={columns}
          pagination={{ pageSize: 10 }}
          className="p-2"
        />
      </div>

      {/* ADD / EDIT MODAL */}
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText={editingRecord ? "Update" : "Create"}
        title={null}
        destroyOnClose
      >
        <div style={S.modalHeaderGradient(config.color.from, config.color.to)}>
          <h2 className="text-lg font-semibold m-0">
            {editingRecord ? `Edit Material` : `Add Material`}
          </h2>
          <p className="text-xs opacity-80 m-0 mt-1">{config.title}</p>
        </div>

        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Material Name"
            rules={[{ required: true, message: "Material name is required" }]}
          >
            <Input placeholder="e.g. Caustic Soda" />
          </Form.Item>

          <Form.Item
            name="mesurmentType"
            label="Measurement Unit"
            rules={[{ required: true, message: "Measurement unit is required" }]}
          >
            <Select options={MEASUREMENT_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------
// Landing cards (Powder / Chemical / Useful) + conditional render
// ---------------------------------------------------------------
export default function ManageMaterialPage() {
  const [activeSection, setActiveSection] = useState(null);

  if (activeSection) {
    return (
      <div className={S.page}>
        <MaterialManager
          config={SECTION_CONFIG[activeSection]}
          onBack={() => setActiveSection(null)}
        />
      </div>
    );
  }

  return (
    <div className={S.page}>
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Manage Material</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage Powder, Chemical & Useful Item Lists
        </p>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {Object.values(SECTION_CONFIG).map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.key} className={`${S.card} p-6`}>
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: section.color.light }}
                >
                  <Icon size={28} style={{ color: section.color.base }} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">{section.title}</h2>
                  <p className="text-sm text-slate-500">{section.subtitle}</p>
                </div>
              </div>

              <button
                className="h-10 px-4 text-white rounded-lg text-sm w-full"
                style={{ backgroundColor: section.color.base }}
                onClick={() => setActiveSection(section.key)}
              >
                Open {section.title}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}