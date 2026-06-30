import { useEffect, useState } from "react";
import {
  Table,
  Modal,
  Form,
  Input,
  Button,
  message,
  Popconfirm,
} from "antd";
import { ShieldAlert, RotateCcw, ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import axiosInstance from "../api/axiosInstance"; // adjust path to your project structure

// ---------------------------------------------------------------
// Section config: drives color, icon, and which `type` is sent
// ---------------------------------------------------------------
const SECTION_CONFIG = {
  reject: {
    key: "reject",
    title: "Reject",
    subtitle: "Manage rejection defect type names",
    color: { base: "#dc2626", light: "#fee2e2", from: "#dc2626", to: "#b91c1c" },
    icon: ShieldAlert,
  },
  rework: {
    key: "rework",
    title: "Rework",
    subtitle: "Manage rework defect type names",
    color: { base: "#d97706", light: "#fef3c7", from: "#d97706", to: "#b45309" },
    icon: RotateCcw,
  },
};

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
// Type-name manager: lists & lets you Add/Edit/Delete names under
// a fixed `type` ("reject" or "rework"). Backed by /api/defect-types
// ---------------------------------------------------------------
function DefectTypeManager({ config, onBack }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  const Icon = config.icon;

  const fetchData = async () => {
    setLoading(true);
    try {
      // hits /api/defects/reject or /api/defects/rework
      const res = await axiosInstance.get(`/defects/${config.key}`);
      setData(res.data?.data || []);
    } catch (err) {
      message.error(`Failed to load ${config.title.toLowerCase()} types`);
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
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({ name: record.name });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const { name } = await form.validateFields();

      if (editingRecord) {
        await axiosInstance.put(`/defects/${config.key}/${editingRecord._id}`, { name });
        message.success(`${config.title} type updated`);
      } else {
        await axiosInstance.post(`/defects/${config.key}`, { name });
        message.success(`${config.title} type added`);
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
      await axiosInstance.delete(`/defects/${config.key}/${id}`);
      message.success("Type deleted");
      fetchData();
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to delete type");
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
      title: `${config.title} Type Name`,
      dataIndex: "name",
      key: "name",
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
            title="Delete this type?"
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
            <h1 className="text-xl font-bold text-slate-800">{config.title} Types</h1>
            <p className="text-sm text-slate-500">{config.subtitle}</p>
          </div>
        </div>

        <Button
          type="primary"
          icon={<Plus size={16} />}
          style={{ backgroundColor: config.color.base, borderColor: config.color.base }}
          onClick={openAddModal}
        >
          Add {config.title} Type
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
        destroyOnHidden
      >
        <div style={S.modalHeaderGradient(config.color.from, config.color.to)}>
          <h2 className="text-lg font-semibold m-0">
            {editingRecord ? `Edit ${config.title} Type` : `Add ${config.title} Type`}
          </h2>
        </div>

        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Type Name"
            rules={[{ required: true, message: "Type name is required" }]}
          >
            <Input placeholder={`e.g. ${config.key === "reject" ? "Bubble Issue" : "Bubble Fixed"}`} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------
// Landing cards (Reject / Rework) + conditional rendering
// ---------------------------------------------------------------
export default function ManageDefectsPage() {
  const [activeSection, setActiveSection] = useState(null); // null | 'reject' | 'rework'

  if (activeSection) {
    return (
      <div className={S.page}>
        <DefectTypeManager
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
        <h1 className="text-2xl font-bold text-slate-800">Manage Defects</h1>
        <p className="text-sm text-slate-500 mt-1">Manage Reject & Rework Defect Lists</p>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                  <h2 className="text-lg font-semibold text-slate-800">{section.title} Items</h2>
                  <p className="text-sm text-slate-500">{section.subtitle}</p>
                </div>
              </div>

              <button
                className="h-10 px-4 text-white rounded-lg text-sm w-full"
                style={{ backgroundColor: section.color.base }}
                onClick={() => setActiveSection(section.key)}
              >
                Open {section.title} Management
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}