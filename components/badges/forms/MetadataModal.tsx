/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable  @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useInputState } from './formInput.hooks'
import { TextInput } from './formInput'
import { Conditional } from '../utils/conditional'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { MetadataFormGroup } from './MetadataFormGroup'
import { MetadataAttributes } from './MetadataAttributes'
import { useMetadataAttributesState } from './MetadataAttributes.hooks'



export interface MetadataModalProps {
  assetFile: File
  metadataFile: File
  updateMetadata: (metadataFile: File) => void
  refresher: boolean
}

export const MetadataModal = (props: MetadataModalProps) => {
  const metadataFile: File = props.metadataFile
  const [metadata, setMetadata] = useState<any>(null)

  let parsedMetadata: any
  const parseMetadata = async () => {
    if (metadataFile) {
      attributesState.reset()
      parsedMetadata = JSON.parse(await metadataFile.text())

      if (!parsedMetadata.attributes || parsedMetadata.attributes.length === 0) {
        attributesState.add({
          trait_type: '',
          value: '',
        })
      } else {
        for (let i = 0; i < parsedMetadata.attributes.length; i++) {
          attributesState.add({
            trait_type: parsedMetadata.attributes[i].trait_type,
            value: parsedMetadata.attributes[i].value,
          })
        }
      }
      if (!parsedMetadata.name) {
        nameState.onChange('')
      } else {
        nameState.onChange(parsedMetadata.name)
      }
      if (!parsedMetadata.description) {
        descriptionState.onChange('')
      } else {
        descriptionState.onChange(parsedMetadata.description)
      }
      if (!parsedMetadata.external_url) {
        externalUrlState.onChange('')
      } else {
        externalUrlState.onChange(parsedMetadata.external_url)
      }
      if (!parsedMetadata.youtube_url) {
        youtubeUrlState.onChange('')
      } else {
        youtubeUrlState.onChange(parsedMetadata.youtube_url)
      }

      setMetadata(parsedMetadata)
    } else {
      attributesState.reset()
      nameState.onChange('')
      descriptionState.onChange('')
      externalUrlState.onChange('')
      youtubeUrlState.onChange('')
      setMetadata(null)
    }
  }

  const nameState = useInputState({
    id: 'name',
    name: 'name',
    title: 'Name',
    placeholder: 'Token name',
    defaultValue: metadata?.name,
  })

  const descriptionState = useInputState({
    id: 'description',
    name: 'description',
    title: 'Description',
    placeholder: 'Token description',
    defaultValue: metadata?.description,
  })

  const externalUrlState = useInputState({
    id: 'externalUrl',
    name: 'externalUrl',
    title: 'External URL',
    placeholder: 'https://',
    defaultValue: metadata?.external_url,
  })

  const youtubeUrlState = useInputState({
    id: 'youtubeUrl',
    name: 'youtubeUrl',
    title: 'Youtube URL',
    placeholder: 'https://',
    defaultValue: metadata?.youtube_url,
  })

  const attributesState = useMetadataAttributesState()

  const generateUpdatedMetadata = () => {
    metadata.attributes = Object.values(attributesState)[1]
    metadata.attributes = metadata.attributes.filter((attribute: { trait_type: string }) => attribute.trait_type !== '')

    if (nameState.value === '') delete metadata.name
    else metadata.name = nameState.value
    if (descriptionState.value === '') delete metadata.description
    else metadata.description = descriptionState.value
    if (externalUrlState.value === '') delete metadata.external_url
    else metadata.external_url = externalUrlState.value
    if (youtubeUrlState.value === '') delete metadata.youtube_url
    else metadata.youtube_url = youtubeUrlState.value

    const metadataFileBlob = new Blob([JSON.stringify(metadata)], {
      type: 'application/json',
    })

    const editedMetadataFile = new File([metadataFileBlob], metadataFile.name.replaceAll('#', ''), {
      type: 'application/json',
    })
    props.updateMetadata(editedMetadataFile)
    toast.success('Metadata updated successfully.')
  }

  useEffect(() => {
    void parseMetadata()
  }, [props.metadataFile, props.refresher])

  return (
    <div>
      <input className="modal-toggle" id="my-modal-4" type="checkbox" />
      <label className="cursor-pointer modal" htmlFor="my-modal-4">
        <label
          className="absolute top-5 bottom-5 w-full max-w-5xl max-h-full border-2 no-scrollbar modal-box"
          htmlFor="temp"
        >
          <MetadataFormGroup
            relatedAsset={props.assetFile}
            subtitle={`Asset filename: ${props.assetFile?.name}`}
            title="Update Metadata"
          >
            <TextInput
              {...nameState}
              disabled={!props.metadataFile}
              onChange={(e) => nameState.onChange(e.target.value)}
            />
            <TextInput
              {...descriptionState}
              disabled={!props.metadataFile}
              onChange={(e) => descriptionState.onChange(e.target.value)}
            />
            <TextInput
              {...externalUrlState}
              disabled={!props.metadataFile}
              onChange={(e) => externalUrlState.onChange(e.target.value)}
            />
            <TextInput
              {...youtubeUrlState}
              disabled={!props.metadataFile}
              onChange={(e) => youtubeUrlState.onChange(e.target.value)}
            />
            <Conditional test={props.metadataFile !== null}>
              <MetadataAttributes
                attributes={attributesState.entries}
                onAdd={attributesState.add}
                onChange={attributesState.update}
                onRemove={attributesState.remove}
                subtitle="Enter trait types and values"
                title="Attributes"
              />
            </Conditional>
            <Button onClick={generateUpdatedMetadata}> {/* isDisabled={!props.metadataFile}*/}
              Update Metadata
            </Button>
            <Conditional test={Boolean(!props.metadataFile)}>
              <Alert title="info">No metadata file to preview. Please select metadata files.</Alert>
            </Conditional>
          </MetadataFormGroup>
        </label>
      </label>
    </div>
  )
}
