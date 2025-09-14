import { useEffect, useState, useRef } from 'react';
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from 'primereact/button';
import { OverlayPanel } from 'primereact/overlaypanel';
import { InputNumber } from 'primereact/inputnumber';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { Paginator } from 'primereact/paginator';

interface Artwork {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: number;
  date_end: number;
}

interface ApiResponse {
  data: Artwork[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    total_pages: number;
    current_page: number;
  };
}

export default function App() {
  const [data, setData] = useState<Artwork[]>([]);
  const [page, setPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(12);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [selectedArtworks, setSelectedArtworks] = useState<Artwork[]>([]);
  const [error, setError] = useState<string>('');
  const [first, setFirst] = useState<number>(0);
  const [selectNumberValue, setSelectNumberValue] = useState<number>(0);
  const op = useRef<OverlayPanel>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const response = await fetch(`https://api.artic.edu/api/v1/artworks?page=${page}&limit=${rowsPerPage}&fields=id,title,place_of_origin,artist_display,inscriptions,date_start,date_end`);
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const apiData: ApiResponse = await response.json();
        
        const transformedData = apiData.data.map(item => ({
          ...item,
          place_of_origin: item.place_of_origin || 'Unknown',
          artist_display: item.artist_display || 'Unknown',
          inscriptions: item.inscriptions || 'None',
          date_start: item.date_start || 0,
          date_end: item.date_end || 0
        }));

        setData(transformedData);
        setTotalRecords(apiData.pagination.total);
        setError('');
      } 
      catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data');
      }
      setLoading(false);
    }
    fetchData();
  }, [page, rowsPerPage]);

  const onPageChange = (event: any) => {
    setPage(event.page + 1);
    setRowsPerPage(event.rows);
    setFirst(event.first);
  };

  const onSelectionChange = (e: any) => {
    setSelectedArtworks(e.value);
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      const newSelection = selectedArtworks.filter(
        selected => !data.some(item => item.id === selected.id)
      );
      setSelectedArtworks(newSelection);
    } 
    else {
      const newSelection = [...selectedArtworks];
      data.forEach(item => {
        if (!newSelection.some(selected => selected.id === item.id)) {
          newSelection.push(item);
        }
      });
      setSelectedArtworks(newSelection);
    }
  };

  const handleSelectNumber = async () => {
    if (selectNumberValue <= 0) return;
    
    try {
      setLoading(true);
      const response = await fetch(`https://api.artic.edu/api/v1/artworks?page=1&limit=${selectNumberValue}&fields=id,title,place_of_origin,artist_display,inscriptions,date_start,date_end`);
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      const apiData: ApiResponse = await response.json();
      
      const itemsToSelect = apiData.data.map(item => ({
        ...item,
        place_of_origin: item.place_of_origin || 'Unknown',
        artist_display: item.artist_display || 'Unknown',
        inscriptions: item.inscriptions || 'None',
        date_start: item.date_start || 0,
        date_end: item.date_end || 0
      }));
      
      const newSelection = [...selectedArtworks];
      itemsToSelect.forEach(item => {
        if (!newSelection.some(selected => selected.id === item.id)) {
          newSelection.push(item);
        }
      });
      
      setSelectedArtworks(newSelection);
      setSelectNumberValue(0);
      if (op.current) {
        op.current.hide();
      }
    } 
    catch (error) {
      console.error('Error fetching data for selection:', error);
      setError('Failed to select items');
    } 
    finally {
      const response = await fetch(`https://api.artic.edu/api/v1/artworks?page=${page}&limit=${rowsPerPage}&fields=id,title,place_of_origin,artist_display,inscriptions,date_start,date_end`);
      if (response.ok) {
        const apiData: ApiResponse = await response.json();
        
        const transformedData = apiData.data.map(item => ({
          ...item,
          place_of_origin: item.place_of_origin || 'Unknown',
          artist_display: item.artist_display || 'Unknown',
          inscriptions: item.inscriptions || 'None',
          date_start: item.date_start || 0,
          date_end: item.date_end || 0
        }));
        setData(transformedData);
      }
      setLoading(false);
    }
  };

  const isAllSelected = data.length > 0 && data.every(item => 
    selectedArtworks.some(selected => selected.id === item.id)
  );

  const selectionHeaderTemplate = () => {
    return (
      <div className="flex align-items-center">
        <input 
          type="checkbox" 
          checked={isAllSelected} 
          onChange={handleSelectAll}
          className="mr-2"
        />
        <Button 
          type="button" 
          icon="pi pi-chevron-down" 
          onClick={(e) => op.current?.toggle(e)}
          className="p-button-text p-button-plain p-1"
        />
        <OverlayPanel ref={op} dismissable>
          <div className="flex flex-column gap-2" style={{width: '200px'}}>
            <label htmlFor="selectNumber">Select number of items:</label>
            <InputNumber 
              id="selectNumber" 
              value={selectNumberValue} 
              onValueChange={(e) => setSelectNumberValue(e.value as number)} 
              min={0} 
              max={totalRecords}
            />
            <Button 
              label="Apply" 
              onClick={handleSelectNumber}
              className="p-button-sm mt-2"
            />
          </div>
        </OverlayPanel>
      </div>
    );
  };


  const onRowSelect = (event: any) => {
    const selectedItem = event.data;
    if(event.originalEvent.target.checked) setSelectedArtworks(prev => [...prev, selectedItem]);
    else setSelectedArtworks(prev => prev.filter(item => item.id !== selectedItem.id));
  };

  
  const handleRowCheckboxChange = (rowData: Artwork, isChecked: boolean) => {
    if(isChecked) setSelectedArtworks(prev => [...prev, rowData]);
    else setSelectedArtworks(prev => prev.filter(item => item.id !== rowData.id));
  };

  const selectionBodyTemplate = (rowData: Artwork) => {
    const isSelected = selectedArtworks.some(selected => selected.id === rowData.id);
    return (
      <input 
        type="checkbox" 
        checked={isSelected}
        onChange={(e) => handleRowCheckboxChange(rowData, e.target.checked)}
      />
    );
  };

  if (error) {
    return (
      <div className="p-4">
        <Message severity="error" text={error} />
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1>Assignment1</h1>
      
      <div className="card">
        {loading && (
          <div className="flex justify-content-center align-items-center py-8">
            <ProgressSpinner />
          </div>
        )}
        
        {!loading && (
          <>
            <DataTable

              value={data}
              selection={selectedArtworks}
              onSelectionChange={onSelectionChange}
              onRowSelect={onRowSelect}
              onRowUnselect={onRowSelect}
              dataKey="id"
              selectionMode="multiple"
              tableStyle={{ minWidth: '50rem' }}

            >
              <Column selectionMode="multiple" header={selectionHeaderTemplate} body={selectionBodyTemplate} headerStyle={{ width: '6rem' }}/>
              <Column field="title" header="Title" />
              <Column field="place_of_origin" header="Place of Origin" />
              <Column field="artist_display" header="Artist"  />
              <Column field="inscriptions" header="Inscriptions" />
              <Column field="date_start" header="Start Date" body={(rowData) => rowData.date_start || 'Unknown'}/>
              <Column field="date_end" header="End Date" body={(rowData) => rowData.date_end || 'Unknown'}/>

            </DataTable>
            
            <Paginator
              first={first}
              rows={rowsPerPage}
              totalRecords={totalRecords}
              rowsPerPageOptions={[12, 25, 50]}
              onPageChange={onPageChange}
              template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
              currentPageReportTemplate="Showing {first} to {last} of {totalRecords} artworks"
            />
            
            <div className="mt-3">
              <strong>Selected: {selectedArtworks.length} items</strong>
            </div>
          </>
        )}
      </div>
    </div>
  );
}