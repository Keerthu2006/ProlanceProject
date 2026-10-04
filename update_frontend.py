import re

with open("frontend/src/pages/dashboard/NeglectDashboard.jsx", "r", encoding="utf-8") as f:
    content = f.read()

helper = """
  const handleTargetedEmail = (targetUserId, actionType, detail, successMsg) => {
    api.post('/owner/automations/manual-trigger', {
      actionType,
      detail,
      targetUserId: targetUserId.toString()
    }).then(() => {
      toast.success(successMsg);
    }).catch(err => {
      toast.error("Failed to send email");
      console.error(err);
    });
  };

  if (loading) return ("""

content = content.replace("  if (loading) return (", helper)

# Now replace the onClick handlers in the Customer Neglect tab
content = content.replace(
    'onClick={() => toast.success(`Re-engagement email queued for ${c.name}`)}',
    'onClick={() => handleTargetedEmail(c.id, "EMAIL_CLIENT", "We noticed you haven\'t posted a project recently. Is there anything we can help you with?", `Re-engagement email queued for ${c.name}`)}'
)

content = content.replace(
    'onClick={() => toast.success(`Discount offer sent to ${c.name}`)}',
    'onClick={() => handleTargetedEmail(c.id, "OFFER_DISCOUNT", "Here is a 20% discount on your next project.", `Discount offer sent to ${c.name}`)}'
)

# Product neglect tab
content = content.replace(
    'onClick={() => toast.success(`Interactive feature guide queued for ${f.feature}`)}',
    'onClick={() => handleTargetedEmail(f.userId, "EMAIL_PRODUCT_NEGLECT", `We noticed you haven\'t used the ${f.feature} feature. Here is a quick guide.`, `Interactive feature guide queued for ${f.feature}`)}'
)

# Freelancer neglect tab
content = content.replace(
    'onClick={() => toast.success(`Profile completion nudge sent to ${p.email || p.name}!`)}',
    'onClick={() => handleTargetedEmail(p.userId || p.id, "EMAIL_CLIENT", "Your profile is incomplete. Completing it increases your chances of getting hired!", `Profile completion nudge sent to ${p.email || p.name}`)}'
)

content = content.replace(
    'onClick={() => toast.success(`Direct project invitation sent to ${p.name}`)}',
    'onClick={() => handleTargetedEmail(p.userId || p.id, "NOTIFY_FREELANCERS", "We have a new premium project that perfectly matches your skills. Check it out!", `Direct project invitation sent to ${p.name}`)}'
)

with open("frontend/src/pages/dashboard/NeglectDashboard.jsx", "w", encoding="utf-8") as f:
    f.write(content)
