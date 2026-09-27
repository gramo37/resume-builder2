import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core'
import type { ReactNode } from 'react'
import type { Achievement, CustomCollection, CustomItem, ResumeDocument } from '../types/resume'
import { dataPanelsFor, type DataPanel } from './bindings'
import {
  blankAchievement,
  blankCertification,
  blankCustomItem,
  blankEducation,
  blankExperience,
  blankLanguage,
  blankLink,
  blankProject,
  blankSkillGroup,
  moveByIndex,
  setCertifications,
  setContact,
  setCustomCollection,
  setEducation,
  setExperience,
  setLanguages,
  setPerson,
  setProjects,
  setSkills,
  setSummaryText,
  updateComponentDefinition,
} from './documentEdit'
import {
  AreaField,
  ItemActions,
  StringList,
  TextField,
  fieldStyles,
} from './fields'
import { humanizeId } from './layoutEdit'
import styles from './SectionForm.module.css'

export type DragHandle = {
  attributes: DraggableAttributes
  listeners: DraggableSyntheticListeners
}

type SectionCardProps = {
  resume: ResumeDocument
  placementId: string
  componentId: string
  onChange: (resume: ResumeDocument) => void
  drag?: DragHandle
}

export function SectionCard({ resume, placementId, componentId, onChange, drag }: SectionCardProps) {
  const definition = resume.template.components[componentId]
  const title = definition?.title || humanizeId(componentId)
  const panels = dataPanelsFor(componentId, resume.template.components)
  const showTitle = definition?.title != null || Boolean(definition?.renderer)

  return (
    <article className={styles.card} data-section={placementId}>
      <header className={styles.header}>
        {drag ? (
          <button
            type="button"
            className={styles.handle}
            aria-label={`Reorder ${title}`}
            {...drag.attributes}
            {...drag.listeners}
          >
            <GripIcon />
          </button>
        ) : null}
        {showTitle ? (
          <label className={styles.titleField}>
            <span className={styles.eyebrow}>Section heading</span>
            <input
              className={styles.titleInput}
              value={definition?.title ?? ''}
              aria-label={`${title} heading`}
              onChange={(event) =>
                onChange(
                  updateComponentDefinition(resume, componentId, (current) => ({
                    ...current,
                    title: event.target.value,
                  })),
                )
              }
            />
          </label>
        ) : (
          <h3 className={styles.staticTitle}>{title}</h3>
        )}
      </header>
      <div className={styles.body}>
        {panels.map((panel) => (
          <DataPanelView
            key={panel.kind === 'custom' ? panel.name : panel.kind}
            resume={resume}
            panel={panel}
            onChange={onChange}
          />
        ))}
      </div>
    </article>
  )
}

export function CustomCollectionCard({
  resume,
  name,
  onChange,
}: {
  resume: ResumeDocument
  name: string
  onChange: (resume: ResumeDocument) => void
}) {
  const collection = resume.data.custom?.[name] ?? { id: name, items: [] }
  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <h3 className={styles.staticTitle}>{collection.title || humanizeId(name)}</h3>
      </header>
      <div className={styles.body}>
        <CustomFields resume={resume} name={name} collection={collection} onChange={onChange} />
      </div>
    </article>
  )
}

function DataPanelView({
  resume,
  panel,
  onChange,
}: {
  resume: ResumeDocument
  panel: DataPanel
  onChange: (resume: ResumeDocument) => void
}) {
  switch (panel.kind) {
    case 'person':
      return <PersonFields resume={resume} onChange={onChange} />
    case 'contact':
      return <ContactFields resume={resume} onChange={onChange} />
    case 'summary':
      return <SummaryFields resume={resume} onChange={onChange} />
    case 'skills':
      return <SkillsFields resume={resume} onChange={onChange} />
    case 'languages':
      return <LanguagesFields resume={resume} onChange={onChange} />
    case 'experience':
      return <ExperienceFields resume={resume} onChange={onChange} />
    case 'projects':
      return <ProjectsFields resume={resume} onChange={onChange} />
    case 'education':
      return <EducationFields resume={resume} onChange={onChange} />
    case 'certifications':
      return <CertificationFields resume={resume} onChange={onChange} />
    case 'custom':
      return (
        <CustomFields
          resume={resume}
          name={panel.name}
          collection={resume.data.custom?.[panel.name] ?? { id: panel.name, items: [] }}
          onChange={onChange}
        />
      )
    default:
      return null
  }
}

function PersonFields({
  resume,
  onChange,
}: {
  resume: ResumeDocument
  onChange: (resume: ResumeDocument) => void
}) {
  const person = resume.data.person
  return (
    <div className={fieldStyles.grid}>
      <TextField
        label="Name"
        value={person.name}
        onChange={(name) => onChange(setPerson(resume, { ...person, name }))}
      />
      <TextField
        label="Headline"
        value={person.headline ?? ''}
        onChange={(headline) =>
          onChange(setPerson(resume, { ...person, headline: emptyToUndefined(headline) }))
        }
      />
    </div>
  )
}

function ContactFields({
  resume,
  onChange,
}: {
  resume: ResumeDocument
  onChange: (resume: ResumeDocument) => void
}) {
  const contact = resume.data.contact
  const links = contact.links ?? []
  return (
    <div className={fieldStyles.stack}>
      <div className={fieldStyles.grid}>
        <TextField
          label="Email"
          type="email"
          value={contact.email ?? ''}
          onChange={(email) => onChange(setContact(resume, { ...contact, email: emptyToUndefined(email) }))}
        />
        <TextField
          label="Phone"
          type="tel"
          value={contact.phone ?? ''}
          onChange={(phone) => onChange(setContact(resume, { ...contact, phone: emptyToUndefined(phone) }))}
        />
        <TextField
          label="Location"
          value={contact.location ?? ''}
          onChange={(location) =>
            onChange(setContact(resume, { ...contact, location: emptyToUndefined(location) }))
          }
        />
      </div>
      {links.map((link, index) => (
        <div key={link.id} className={fieldStyles.item}>
          <div className={fieldStyles.itemHead}>
            <p className={fieldStyles.itemTitle}>Link {index + 1}</p>
            <ItemActions
              index={index}
              count={links.length}
              label={`link ${index + 1}`}
              onMove={(direction) =>
                onChange(setContact(resume, { ...contact, links: moveByIndex(links, index, direction) }))
              }
              onRemove={() =>
                onChange(setContact(resume, { ...contact, links: links.filter((item) => item.id !== link.id) }))
              }
            />
          </div>
          <div className={fieldStyles.grid}>
            <TextField
              label="Label"
              value={link.label}
              onChange={(label) =>
                onChange(
                  setContact(resume, {
                    ...contact,
                    links: links.map((item) => (item.id === link.id ? { ...item, label } : item)),
                  }),
                )
              }
            />
            <TextField
              label="URL"
              type="url"
              value={link.url}
              onChange={(url) =>
                onChange(
                  setContact(resume, {
                    ...contact,
                    links: links.map((item) => (item.id === link.id ? { ...item, url } : item)),
                  }),
                )
              }
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        className={fieldStyles.textButton}
        onClick={() => onChange(setContact(resume, { ...contact, links: [...links, blankLink()] }))}
      >
        Add link
      </button>
    </div>
  )
}

function SummaryFields({
  resume,
  onChange,
}: {
  resume: ResumeDocument
  onChange: (resume: ResumeDocument) => void
}) {
  return (
    <AreaField
      label="Summary"
      value={resume.data.summary?.text ?? ''}
      onChange={(text) => onChange(setSummaryText(resume, text))}
    />
  )
}

function SkillsFields({
  resume,
  onChange,
}: {
  resume: ResumeDocument
  onChange: (resume: ResumeDocument) => void
}) {
  const groups = resume.data.skills ?? []
  return (
    <CollectionList
      items={groups}
      noun="skill group"
      onAdd={() => onChange(setSkills(resume, [...groups, blankSkillGroup()]))}
      renderItem={(group, index) => (
        <div className={fieldStyles.stack}>
          <div className={fieldStyles.itemHead}>
            <p className={fieldStyles.itemTitle}>{group.name || `Skill group ${index + 1}`}</p>
            <ItemActions
              index={index}
              count={groups.length}
              label={group.name || `skill group ${index + 1}`}
              onMove={(direction) => onChange(setSkills(resume, moveByIndex(groups, index, direction)))}
              onRemove={() => onChange(setSkills(resume, groups.filter((item) => item.id !== group.id)))}
            />
          </div>
          <TextField
            label="Group name"
            value={group.name}
            onChange={(name) => onChange(setSkills(resume, updateById(groups, group.id, { name })))}
          />
          <StringList
            label="Skill"
            items={group.items}
            onChange={(items) => onChange(setSkills(resume, updateById(groups, group.id, { items })))}
          />
        </div>
      )}
    />
  )
}

function LanguagesFields({
  resume,
  onChange,
}: {
  resume: ResumeDocument
  onChange: (resume: ResumeDocument) => void
}) {
  const languages = resume.data.languages ?? []
  return (
    <CollectionList
      items={languages}
      noun="language"
      onAdd={() => onChange(setLanguages(resume, [...languages, blankLanguage()]))}
      renderItem={(language, index) => (
        <div className={fieldStyles.stack}>
          <div className={fieldStyles.itemHead}>
            <p className={fieldStyles.itemTitle}>{language.name || `Language ${index + 1}`}</p>
            <ItemActions
              index={index}
              count={languages.length}
              label={language.name || `language ${index + 1}`}
              onMove={(direction) => onChange(setLanguages(resume, moveByIndex(languages, index, direction)))}
              onRemove={() =>
                onChange(setLanguages(resume, languages.filter((item) => item.id !== language.id)))
              }
            />
          </div>
          <div className={fieldStyles.grid}>
            <TextField
              label="Language"
              value={language.name}
              onChange={(name) => onChange(setLanguages(resume, updateById(languages, language.id, { name })))}
            />
            <TextField
              label="Level"
              value={language.level ?? ''}
              onChange={(level) =>
                onChange(setLanguages(resume, updateById(languages, language.id, { level: emptyToUndefined(level) })))
              }
            />
          </div>
        </div>
      )}
    />
  )
}

function ExperienceFields({
  resume,
  onChange,
}: {
  resume: ResumeDocument
  onChange: (resume: ResumeDocument) => void
}) {
  const items = resume.data.experience ?? []
  return (
    <CollectionList
      items={items}
      noun="experience"
      onAdd={() => onChange(setExperience(resume, [...items, blankExperience()]))}
      renderItem={(item, index) => (
        <div className={fieldStyles.stack}>
          <div className={fieldStyles.itemHead}>
            <p className={fieldStyles.itemTitle}>{item.title || item.company || `Role ${index + 1}`}</p>
            <ItemActions
              index={index}
              count={items.length}
              label={item.company || `experience ${index + 1}`}
              onMove={(direction) => onChange(setExperience(resume, moveByIndex(items, index, direction)))}
              onRemove={() => onChange(setExperience(resume, items.filter((entry) => entry.id !== item.id)))}
            />
          </div>
          <div className={fieldStyles.grid}>
            <TextField
              label="Title"
              value={item.title}
              onChange={(title) => onChange(setExperience(resume, updateById(items, item.id, { title })))}
            />
            <TextField
              label="Company"
              value={item.company}
              onChange={(company) => onChange(setExperience(resume, updateById(items, item.id, { company })))}
            />
            <TextField
              label="Location"
              value={item.location ?? ''}
              onChange={(location) =>
                onChange(setExperience(resume, updateById(items, item.id, { location: emptyToUndefined(location) })))
              }
            />
            <TextField
              label="Start"
              value={item.start_date ?? ''}
              placeholder="2022-06"
              onChange={(start) =>
                onChange(
                  setExperience(resume, updateById(items, item.id, { start_date: emptyToUndefined(start) })),
                )
              }
            />
            <TextField
              label="End"
              value={item.end_date ?? ''}
              placeholder="Present"
              onChange={(end) =>
                onChange(setExperience(resume, updateById(items, item.id, { end_date: end === '' ? null : end })))
              }
            />
          </div>
          <AreaField
            label="Description"
            value={item.description ?? ''}
            onChange={(description) =>
              onChange(
                setExperience(resume, updateById(items, item.id, { description: emptyToUndefined(description) })),
              )
            }
          />
          <AchievementsEditor
            items={item.achievements ?? []}
            onChange={(achievements) => onChange(setExperience(resume, updateById(items, item.id, { achievements })))}
          />
        </div>
      )}
    />
  )
}

function ProjectsFields({
  resume,
  onChange,
}: {
  resume: ResumeDocument
  onChange: (resume: ResumeDocument) => void
}) {
  const items = resume.data.projects ?? []
  return (
    <CollectionList
      items={items}
      noun="project"
      onAdd={() => onChange(setProjects(resume, [...items, blankProject()]))}
      renderItem={(item, index) => (
        <div className={fieldStyles.stack}>
          <div className={fieldStyles.itemHead}>
            <p className={fieldStyles.itemTitle}>{item.name || `Project ${index + 1}`}</p>
            <ItemActions
              index={index}
              count={items.length}
              label={item.name || `project ${index + 1}`}
              onMove={(direction) => onChange(setProjects(resume, moveByIndex(items, index, direction)))}
              onRemove={() => onChange(setProjects(resume, items.filter((entry) => entry.id !== item.id)))}
            />
          </div>
          <div className={fieldStyles.grid}>
            <TextField
              label="Name"
              value={item.name}
              onChange={(name) => onChange(setProjects(resume, updateById(items, item.id, { name })))}
            />
            <TextField
              label="URL"
              type="url"
              value={item.url ?? ''}
              onChange={(url) =>
                onChange(setProjects(resume, updateById(items, item.id, { url: emptyToUndefined(url) })))
              }
            />
          </div>
          <AreaField
            label="Description"
            value={item.description ?? ''}
            onChange={(description) =>
              onChange(setProjects(resume, updateById(items, item.id, { description: emptyToUndefined(description) })))
            }
          />
          <StringList
            label="Technology"
            items={item.technologies ?? []}
            onChange={(technologies) => onChange(setProjects(resume, updateById(items, item.id, { technologies })))}
          />
          <AchievementsEditor
            items={item.achievements ?? []}
            onChange={(achievements) => onChange(setProjects(resume, updateById(items, item.id, { achievements })))}
          />
        </div>
      )}
    />
  )
}

function EducationFields({
  resume,
  onChange,
}: {
  resume: ResumeDocument
  onChange: (resume: ResumeDocument) => void
}) {
  const items = resume.data.education ?? []
  return (
    <CollectionList
      items={items}
      noun="education"
      onAdd={() => onChange(setEducation(resume, [...items, blankEducation()]))}
      renderItem={(item, index) => (
        <div className={fieldStyles.stack}>
          <div className={fieldStyles.itemHead}>
            <p className={fieldStyles.itemTitle}>{item.institution || item.degree || `School ${index + 1}`}</p>
            <ItemActions
              index={index}
              count={items.length}
              label={item.institution || `education ${index + 1}`}
              onMove={(direction) => onChange(setEducation(resume, moveByIndex(items, index, direction)))}
              onRemove={() => onChange(setEducation(resume, items.filter((entry) => entry.id !== item.id)))}
            />
          </div>
          <div className={fieldStyles.grid}>
            <TextField
              label="Degree"
              value={item.degree}
              onChange={(degree) => onChange(setEducation(resume, updateById(items, item.id, { degree })))}
            />
            <TextField
              label="Field"
              value={item.field ?? ''}
              onChange={(field) =>
                onChange(setEducation(resume, updateById(items, item.id, { field: emptyToUndefined(field) })))
              }
            />
            <TextField
              label="Institution"
              value={item.institution}
              onChange={(institution) =>
                onChange(setEducation(resume, updateById(items, item.id, { institution })))
              }
            />
            <TextField
              label="Location"
              value={item.location ?? ''}
              onChange={(location) =>
                onChange(setEducation(resume, updateById(items, item.id, { location: emptyToUndefined(location) })))
              }
            />
            <TextField
              label="Start"
              value={item.start_date ?? ''}
              onChange={(start) =>
                onChange(setEducation(resume, updateById(items, item.id, { start_date: emptyToUndefined(start) })))
              }
            />
            <TextField
              label="End"
              value={item.end_date ?? ''}
              placeholder="Present"
              onChange={(end) =>
                onChange(setEducation(resume, updateById(items, item.id, { end_date: end === '' ? null : end })))
              }
            />
          </div>
          <AreaField
            label="Description"
            value={item.description ?? ''}
            onChange={(description) =>
              onChange(
                setEducation(resume, updateById(items, item.id, { description: emptyToUndefined(description) })),
              )
            }
          />
          <AchievementsEditor
            items={item.achievements ?? []}
            onChange={(achievements) => onChange(setEducation(resume, updateById(items, item.id, { achievements })))}
          />
        </div>
      )}
    />
  )
}

function CertificationFields({
  resume,
  onChange,
}: {
  resume: ResumeDocument
  onChange: (resume: ResumeDocument) => void
}) {
  const items = resume.data.certifications ?? []
  return (
    <CollectionList
      items={items}
      noun="certification"
      onAdd={() => onChange(setCertifications(resume, [...items, blankCertification()]))}
      renderItem={(item, index) => (
        <div className={fieldStyles.stack}>
          <div className={fieldStyles.itemHead}>
            <p className={fieldStyles.itemTitle}>{item.name || `Certification ${index + 1}`}</p>
            <ItemActions
              index={index}
              count={items.length}
              label={item.name || `certification ${index + 1}`}
              onMove={(direction) => onChange(setCertifications(resume, moveByIndex(items, index, direction)))}
              onRemove={() =>
                onChange(setCertifications(resume, items.filter((entry) => entry.id !== item.id)))
              }
            />
          </div>
          <div className={fieldStyles.grid}>
            <TextField
              label="Name"
              value={item.name}
              onChange={(name) => onChange(setCertifications(resume, updateById(items, item.id, { name })))}
            />
            <TextField
              label="Issuer"
              value={item.issuer ?? ''}
              onChange={(issuer) =>
                onChange(
                  setCertifications(resume, updateById(items, item.id, { issuer: emptyToUndefined(issuer) })),
                )
              }
            />
            <TextField
              label="Issued"
              value={item.issue_date ?? ''}
              onChange={(issue) =>
                onChange(
                  setCertifications(resume, updateById(items, item.id, { issue_date: emptyToUndefined(issue) })),
                )
              }
            />
            <TextField
              label="Expires"
              value={item.expiry_date ?? ''}
              placeholder="Present"
              onChange={(expiry) =>
                onChange(
                  setCertifications(resume, updateById(items, item.id, { expiry_date: expiry === '' ? null : expiry })),
                )
              }
            />
            <TextField
              label="URL"
              type="url"
              value={item.url ?? ''}
              onChange={(url) =>
                onChange(setCertifications(resume, updateById(items, item.id, { url: emptyToUndefined(url) })))
              }
            />
          </div>
        </div>
      )}
    />
  )
}

function CustomFields({
  resume,
  name,
  collection,
  onChange,
}: {
  resume: ResumeDocument
  name: string
  collection: CustomCollection
  onChange: (resume: ResumeDocument) => void
}) {
  const save = (next: CustomCollection) => onChange(setCustomCollection(resume, name, next))
  return (
    <div className={fieldStyles.stack}>
      <TextField
        label="Title"
        value={collection.title ?? ''}
        onChange={(title) => save({ ...collection, title: emptyToUndefined(title) })}
      />
      <CollectionList
        items={collection.items}
        noun="item"
        onAdd={() => save({ ...collection, items: [...collection.items, blankCustomItem(collection.items[0])] })}
        renderItem={(item, index) => (
          <div className={fieldStyles.stack}>
            <div className={fieldStyles.itemHead}>
              <p className={fieldStyles.itemTitle}>Item {index + 1}</p>
              <ItemActions
                index={index}
                count={collection.items.length}
                label={`item ${index + 1}`}
                onMove={(direction) => save({ ...collection, items: moveByIndex(collection.items, index, direction) })}
                onRemove={() =>
                  save({ ...collection, items: collection.items.filter((entry) => entry.id !== item.id) })
                }
              />
            </div>
            <CustomItemFields
              item={item}
              onChange={(next) =>
                save({
                  ...collection,
                  items: collection.items.map((entry) => (entry.id === item.id ? next : entry)),
                })
              }
            />
          </div>
        )}
      />
    </div>
  )
}

function CustomItemFields({ item, onChange }: { item: CustomItem; onChange: (item: CustomItem) => void }) {
  const keys = Object.keys(item).filter((key) => key !== 'id')
  if (keys.length === 0) {
    return (
      <TextField label="Text" value="" onChange={(text) => onChange({ ...item, text })} />
    )
  }
  return (
    <div className={fieldStyles.stack}>
      {keys.map((key) => {
        const value = item[key]
        if (typeof value === 'string' || value == null) {
          return (
            <TextField
              key={key}
              label={humanizeId(key)}
              value={typeof value === 'string' ? value : ''}
              onChange={(next) => onChange({ ...item, [key]: next })}
            />
          )
        }
        if (Array.isArray(value) && value.every((entry) => typeof entry === 'string')) {
          return (
            <StringList
              key={key}
              label={humanizeId(key)}
              items={value}
              onChange={(next) => onChange({ ...item, [key]: next })}
            />
          )
        }
        if (typeof value === 'number') {
          return (
            <TextField
              key={key}
              label={humanizeId(key)}
              value={String(value)}
              onChange={(next) => {
                const parsed = Number(next)
                onChange({ ...item, [key]: Number.isFinite(parsed) ? parsed : value })
              }}
            />
          )
        }
        return null
      })}
    </div>
  )
}

function AchievementsEditor({
  items,
  onChange,
}: {
  items: Achievement[]
  onChange: (items: Achievement[]) => void
}) {
  return (
    <div className={fieldStyles.list}>
      <p className={fieldStyles.nestedLabel}>Achievements</p>
      {items.map((item, index) => (
        <div key={item.id} className={fieldStyles.listRow}>
          <textarea
            className={fieldStyles.area}
            value={item.text}
            aria-label={`Achievement ${index + 1}`}
            onChange={(event) =>
              onChange(items.map((entry) => (entry.id === item.id ? { ...entry, text: event.target.value } : entry)))
            }
          />
          <ItemActions
            index={index}
            count={items.length}
            label={`achievement ${index + 1}`}
            onMove={(direction) => onChange(moveByIndex(items, index, direction))}
            onRemove={() => onChange(items.filter((entry) => entry.id !== item.id))}
          />
        </div>
      ))}
      <button type="button" className={fieldStyles.textButton} onClick={() => onChange([...items, blankAchievement()])}>
        Add achievement
      </button>
    </div>
  )
}

function CollectionList<T extends { id: string }>({
  items,
  noun,
  onAdd,
  renderItem,
}: {
  items: T[]
  noun: string
  onAdd: () => void
  renderItem: (item: T, index: number) => ReactNode
}) {
  return (
    <div className={fieldStyles.stack}>
      {items.map((item, index) => (
        <div key={item.id} className={fieldStyles.item}>
          {renderItem(item, index)}
        </div>
      ))}
      <button type="button" className={fieldStyles.textButton} onClick={onAdd}>
        Add {noun}
      </button>
    </div>
  )
}

function emptyToUndefined(value: string): string | undefined {
  return value === '' ? undefined : value
}

function updateById<T extends { id: string }>(items: T[], id: string, patch: Partial<T>): T[] {
  return items.map((item) => (item.id === id ? { ...item, ...patch } : item))
}

function GripIcon() {
  return (
    <svg className={styles.grip} width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <circle cx="4" cy="3" r="1.15" />
      <circle cx="10" cy="3" r="1.15" />
      <circle cx="4" cy="7" r="1.15" />
      <circle cx="10" cy="7" r="1.15" />
      <circle cx="4" cy="11" r="1.15" />
      <circle cx="10" cy="11" r="1.15" />
    </svg>
  )
}
