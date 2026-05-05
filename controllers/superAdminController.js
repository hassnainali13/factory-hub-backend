// backend/controllers/superAdminController.js
const Workspace = require("../models/Workspace");
const User = require("../models/User"); // ✅ User import added

exports.getAllWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find()
      .populate({
        path: "createdBy",
        select: "name",
      });

    res.status(200).json({ workspaces });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching workspaces" });
  }
};

exports.approveWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findByIdAndUpdate(
      req.params.id,
      { status: "active" },
      { new: true }
    );
    res.json({ message: "Workspace approved", workspace });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.rejectWorkspace = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ findByIdAndDelete ki jagah pehle find karo taake createdBy mile
    const workspace = await Workspace.findById(id);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    // ✅ User ka role aur workspaceId reset karo
    await User.findByIdAndUpdate(workspace.createdBy, {
      role: "user",
      workspaceId: null,
    });

    // ✅ Ab workspace delete karo
    await Workspace.findByIdAndDelete(id);

    res.status(200).json({ message: "Workspace rejected and deleted" });
  } catch (err) {
    console.error("Reject/Delete workspace error:", err);
    res.status(500).json({ message: "Server error" });
  }
};