import ProductionEntry from "../models/production.model.js";
import DownTime      from "../models/downTime.model.js";
import Consumable    from "../models/consumable.model.js";
import Defect        from "../models/defects.model.js";
import Rework        from "../models/rework.model.js";
import Rejected      from "../models/reject.model.js";

// ── helpers ──────────────────────────────────────────────────────────────────

const sum   = (arr, key)     => arr.reduce((acc, i) => acc + Number(i[key] || 0), 0);
const ids   = (docs)         => docs.map((d) => d._id);
const pct   = (n, d)         => d > 0 ? ((n / d) * 100).toFixed(2) : 0;
const save  = (Model, arr)   => arr.length > 0 ? Model.insertMany(arr) : Promise.resolve([]);

// ── CREATE ───────────────────────────────────────────────────────────────────

export const createProductionEntry = async (req, res) => {
  try {
    const {
      userId, plantId, shiftId,
      date, shift, location, plant, reportedBy, email,
      requiredManpower, availableManpower,
      productionEntries  = [],
      plannedDowntime    = [],
      unplannedDowntime  = [],
      consumables        = [],
      ptChemicals        = [],
      powders            = [],
      defects            = [],
      reworks            = [],
      rejections         = [],
    } = req.body;

    if (!date) return res.status(400).json({ success: false, message: "Production Date Required" });

    // ── manpower ──────────────────────────────────────────────────────────────
    const shortManpower = Number(requiredManpower || 0) - Number(availableManpower || 0);

    // ── downtime ──────────────────────────────────────────────────────────────
    const allDowntime = [
      ...plannedDowntime.map((i)   => ({ ...i, downtimeCategory: "Planned"   })),
      ...unplannedDowntime.map((i) => ({ ...i, downtimeCategory: "Unplanned" })),
    ];

    // ── persist child collections ─────────────────────────────────────────────
    const [downtimeDocs, consumableDocs, chemicalDocs, powderDocs, defectDocs, reworkDocs, rejectionDocs] =
      await Promise.all([
        save(DownTime,   allDowntime),
        save(Consumable, consumables),
        save(PTChemical, ptChemicals),
        save(Powder,     powders),
        save(Defect,     defects),
        save(Rework,     reworks),
        save(Rejected,   rejections),
      ]);

    // ── OEE calculation ───────────────────────────────────────────────────────
    const totalProduction = productionEntries.reduce((acc, m) =>
      acc + (m.parts?.reduce((s, p) => s + Number(p.quantity || 0), 0) || 0), 0);

    const totalDefects          = sum(defects,     "defectQuantity");
    const totalRejected         = sum(rejections,  "rejectedQuantity");
    const totalDowntimeMinutes  = sum(allDowntime, "duration");

    const availableTime  = 630;
    const runtime        = availableTime - totalDowntimeMinutes;

    const availability = pct(runtime,                                          availableTime);
    const quality      = pct(totalProduction - totalDefects - totalRejected,   totalProduction);
    const performance  = 100;
    const oee          = ((availability * performance * quality) / 10000).toFixed(2);

    // ── create main entry ─────────────────────────────────────────────────────
    const entry = await ProductionEntry.create({
      userId, plantId, shiftId,
      date, shift, location, plant, reportedBy, email,
      requiredManpower, availableManpower, shortManpower,
      productionEntries,
      downtimeIds:    ids(downtimeDocs),
      consumableIds:  ids(consumableDocs),
      chemicalIds:    ids(chemicalDocs),
      powderIds:      ids(powderDocs),
      defectIds:      ids(defectDocs),
      reworkIds:      ids(reworkDocs),
      rejectionIds:   ids(rejectionDocs),
      availability, performance, quality, oee,
      reportTime: new Date(),
    });

    res.status(201).json({ success: true, message: "Production Entry Created Successfully", entry });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET ALL ──────────────────────────────────────────────────────────────────

export const getAllProductionEntries = async (req, res) => {
  try {
    const entries = await ProductionEntry.find()
      .populate("userId").populate("plantId").populate("shiftId")
      .populate("downtimeIds").populate("consumableIds").populate("chemicalIds")
      .populate("powderIds").populate("defectIds").populate("reworkIds").populate("rejectionIds")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: entries.length, entries });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET SINGLE ───────────────────────────────────────────────────────────────

export const getSingleProductionEntry = async (req, res) => {
  try {
    const entry = await ProductionEntry.findById(req.params.id)
      .populate("userId").populate("plantId").populate("shiftId")
      .populate("downtimeIds").populate("consumableIds").populate("chemicalIds")
      .populate("powderIds").populate("defectIds").populate("reworkIds").populate("rejectionIds");

    if (!entry) return res.status(404).json({ success: false, message: "Production Entry Not Found" });

    res.status(200).json({ success: true, entry });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── UPDATE ───────────────────────────────────────────────────────────────────

export const updateProductionEntry = async (req, res) => {
  try {
    const updated = await ProductionEntry.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!updated) return res.status(404).json({ success: false, message: "Production Entry Not Found" });

    res.status(200).json({ success: true, message: "Production Entry Updated", updated });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── DELETE ───────────────────────────────────────────────────────────────────

export const deleteProductionEntry = async (req, res) => {
  try {
    const entry = await ProductionEntry.findById(req.params.id);

    if (!entry) return res.status(404).json({ success: false, message: "Production Entry Not Found" });

    // delete all child collections in parallel
    await Promise.all([
      DownTime.deleteMany ({  _id: { $in: entry.downtimeIds   } }),
      Consumable.deleteMany({ _id: { $in: entry.consumableIds } }),
      PTChemical.deleteMany({ _id: { $in: entry.chemicalIds   } }),
      Powder.deleteMany    ({ _id: { $in: entry.powderIds     } }),
      Defect.deleteMany    ({ _id: { $in: entry.defectIds     } }),
      Rework.deleteMany    ({ _id: { $in: entry.reworkIds     } }),
      Rejected.deleteMany  ({ _id: { $in: entry.rejectionIds  } }),
    ]);

    await ProductionEntry.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: "Production Entry Deleted Successfully" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── OEE ANALYTICS ────────────────────────────────────────────────────────────

export const getOEEAnalytics = async (req, res) => {
  try {
    const entries      = await ProductionEntry.find();
    const total        = entries.length;
    const avg          = (key) => total > 0 ? (entries.reduce((a, i) => a + Number(i[key] || 0), 0) / total).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      analytics: {
        availability: avg("availability"),
        performance:  avg("performance"),
        quality:      avg("quality"),
        oee:          avg("oee"),
      },
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};