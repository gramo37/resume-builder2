import { ResumeTemplate } from '../../shared/database';

export const templateService = {
  async list() {
    const templates = await ResumeTemplate.findAll({
      attributes: ['id', 'key', 'name', 'description'],
      order: [['id', 'ASC']],
    });

    return {
      templates: templates.map((template) => ({
        id: template.id,
        key: template.key,
        name: template.name,
        description: template.description,
      })),
    };
  },
};
